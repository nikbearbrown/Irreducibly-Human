import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Row types (as returned by the DB driver)
// ---------------------------------------------------------------------------
// NOTE: employment_index is NUMERIC → the neon driver returns it as a STRING
// (to preserve precision), so it must be Number()-cast when building the
// response. employment/year are INTEGER → already numbers; booleans are fine.
interface EmploymentRow {
  soc_code: string
  year: number
  employment: number | null
  employment_index: string | null
  is_projected: boolean
  is_suppressed: boolean
  occ_title: string | null
}

interface TitleRow {
  soc_code: string
  soc_code_bls: string
  title: string
}

interface MilestoneRow {
  year: number
  month: number | null
  label: string
  description: string | null
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------
interface DataPoint {
  year: number
  employment: number | null
  employment_index: number | null
  // NOTE: is_projected rows should render as DASHED lines (Step 15, chart
  // component). The data carries the flag through; chart styling is out of
  // scope here. (Currently all OEWS rows are is_projected=false — no
  // projection source is loaded yet.)
  is_projected: boolean
  is_suppressed: boolean
}

interface Series {
  soc_code: string // BLS format (e.g. "15-1252")
  title: string
  data: DataPoint[]
}

interface Milestone {
  year: number
  month: number | null
  label: string
  description: string
}

interface EmploymentResponse {
  series: Series[]
  milestones: Milestone[]
  warnings?: string[]
}

// Strip the O*NET ".NN" suffix to get the BLS code. Handles both formats:
//   "15-1252.00" → "15-1252"   |   "15-1252" → "15-1252" (unchanged)
function toBlsCode(code: string): string {
  return code.replace(/\.\d{2}$/, '')
}

// Fill missing years within a series' own min..max range with explicit NULL
// entries so D3 renders a broken line instead of interpolating across a gap.
function buildData(rows: EmploymentRow[]): DataPoint[] {
  const byYear = new Map<number, EmploymentRow>()
  for (const r of rows) byYear.set(r.year, r)
  const years = rows.map((r) => r.year)
  const min = Math.min(...years)
  const max = Math.max(...years)

  const out: DataPoint[] = []
  for (let y = min; y <= max; y++) {
    const r = byYear.get(y)
    if (r) {
      out.push({
        year: y,
        employment: r.employment ?? null,
        employment_index: r.employment_index == null ? null : Number(r.employment_index),
        is_projected: r.is_projected,
        is_suppressed: r.is_suppressed,
      })
    } else {
      out.push({ year: y, employment: null, employment_index: null, is_projected: false, is_suppressed: false })
    }
  }
  return out
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawCodes = (searchParams.get('soc') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (rawCodes.length === 0 || rawCodes.length > 5) {
    return NextResponse.json({ error: 'Provide 1 to 5 soc codes' }, { status: 400 })
  }

  // Preserve request order; keep both the full (requested) code and its BLS code.
  const requested = rawCodes.map((full) => ({ full, bls: toBlsCode(full) }))
  const blsCodes = [...new Set(requested.map((r) => r.bls))]
  const fullCodes = [...new Set(requested.map((r) => r.full))]

  try {
    // Query 1 — employment data (no O*NET join: bls_employment is unique per
    // (soc_code, year), so there is no fan-out).
    const empRows = (await sql`
      SELECT soc_code, year, employment, employment_index,
             is_projected, is_suppressed, occ_title
      FROM bls_employment
      WHERE soc_code = ANY(${blsCodes})
      ORDER BY soc_code, year
    `) as unknown as EmploymentRow[]

    // Query 2 — title lookup keyed on the specific requested O*NET codes.
    const titleRows = (await sql`
      SELECT soc_code, soc_code_bls, title
      FROM onet_occupations
      WHERE soc_code = ANY(${fullCodes})
    `) as unknown as TitleRow[]

    // Query 3 — milestones.
    const milestoneRows = (await sql`
      SELECT year, month, label, description
      FROM ai_milestones
      WHERE display_on_chart = TRUE
      ORDER BY year, month NULLS LAST
    `) as unknown as MilestoneRow[]

    // Index lookups.
    const titleByFull = new Map<string, string>()
    for (const t of titleRows) titleByFull.set(t.soc_code, t.title)

    const rowsByBls = new Map<string, EmploymentRow[]>()
    for (const r of empRows) {
      const arr = rowsByBls.get(r.soc_code) ?? []
      arr.push(r)
      rowsByBls.set(r.soc_code, arr)
    }

    const warnings: string[] = []

    // Duplicate-BLS warning: distinct requested codes that normalize to the
    // same BLS code share one employment series.
    const fullsByBls = new Map<string, string[]>()
    for (const r of requested) {
      const arr = fullsByBls.get(r.bls) ?? []
      if (!arr.includes(r.full)) arr.push(r.full)
      fullsByBls.set(r.bls, arr)
    }
    for (const [, fulls] of fullsByBls) {
      if (fulls.length > 1) {
        warnings.push(`${fulls.join(' and ')} share the same BLS employment data — showing one series`)
      }
    }

    // Software Developers intentional gap.
    if (blsCodes.includes('15-1252')) {
      warnings.push(
        "Software Developers wasn't tracked separately by BLS in 2019-2020: it was folded into a combined code " +
          "with QA Analysts (SOC 15-1256), so data for Software Developers alone isn't available for those years."
      )
    }

    // Build one series per BLS code, in request order, labelled with the
    // first-requested code's title. Omit codes with no BLS data.
    const series: Series[] = []
    const emitted = new Set<string>()
    for (const r of requested) {
      if (emitted.has(r.bls)) continue
      emitted.add(r.bls)
      const rows = rowsByBls.get(r.bls)
      if (!rows || rows.length === 0) continue // no BLS data → omit

      const firstFull = requested.find((x) => x.bls === r.bls)!.full
      const latestOccTitle =
        [...rows].sort((a, b) => b.year - a.year).find((x) => x.occ_title)?.occ_title ?? null
      const title = titleByFull.get(firstFull) ?? latestOccTitle ?? r.bls

      series.push({ soc_code: r.bls, title, data: buildData(rows) })
    }

    const milestones: Milestone[] = milestoneRows.map((m) => ({
      year: m.year,
      month: m.month,
      label: m.label,
      description: m.description ?? '',
    }))

    const response: EmploymentResponse = { series, milestones }
    if (warnings.length > 0) response.warnings = warnings
    return NextResponse.json(response)
  } catch (err) {
    console.error('[api/onet/employment] Database error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
