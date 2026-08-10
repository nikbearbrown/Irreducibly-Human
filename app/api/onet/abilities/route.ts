import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_SCALES = ['LV', 'IM']
const VALID_CATEGORIES = ['cognitive', 'psychomotor', 'physical', 'sensory', 'all']

// ---------------------------------------------------------------------------
// Row types (as returned by the DB driver)
// NOTE: data_value, lower_ci, upper_ci, mean_value, ci_lower, ci_upper are
// NUMERIC → the neon driver returns them as STRINGS; they must be Number()-cast.
// ---------------------------------------------------------------------------
interface AbilityRow {
  soc_code: string
  element_id: string
  element_name: string
  category: string
  subcategory: string | null
  data_value: string | null
  lower_ci: string | null
  upper_ci: string | null
  n: number | null
  recommend_suppress: boolean
  not_relevant: boolean | null
}

interface StatRow {
  element_id: string
  group_type: string
  group_code: string
  mean_value: string | null
  ci_lower: string | null
  ci_upper: string | null
  occupation_count: number
}

interface OccRow {
  soc_code: string
  major_group_code: string | null
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------
interface OccupationScore {
  soc_code: string
  data_value: number | null
  lower_ci: number | null
  upper_ci: number | null
  n: number | null
  // NOTE: recommend_suppress / not_relevant are Step 16 chart concerns — the
  // chart renders suppressed abilities differently and not_relevant as open
  // circles. The data flows through correctly here.
  recommend_suppress: boolean
  not_relevant: boolean | null
}

interface StatBand {
  mean_value: number
  ci_lower: number
  ci_upper: number
  occupation_count: number
}

interface AbilityElement {
  element_id: string
  element_name: string
  category: string
  subcategory: string | null
  occupations: OccupationScore[]
  overall: StatBand | null
  field: StatBand | null
}

interface AbilitiesResponse {
  abilities: AbilityElement[]
}

const num = (v: string | null): number | null => (v == null ? null : Number(v))

function toBand(s: StatRow | undefined): StatBand | null {
  if (!s) return null
  return {
    mean_value: Number(s.mean_value),
    ci_lower: Number(s.ci_lower),
    ci_upper: Number(s.ci_upper),
    occupation_count: s.occupation_count,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const socCodes = (searchParams.get('soc') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    // Normalize to full O*NET format: append .00 when no dot present.
    .map((c) => (c.includes('.') ? c : `${c}.00`))
  if (socCodes.length === 0) {
    return NextResponse.json({ error: 'Provide 1 to 5 soc codes' }, { status: 400 })
  }
  if (socCodes.length > 5) {
    return NextResponse.json({ error: 'Provide 1 to 5 soc codes' }, { status: 400 })
  }

  const scale = (searchParams.get('scale') || 'LV').trim().toUpperCase()
  if (!VALID_SCALES.includes(scale)) {
    return NextResponse.json({ error: 'scale must be LV or IM' }, { status: 400 })
  }

  const category = (searchParams.get('category') || 'all').trim().toLowerCase()
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    // Query 1 — per-occupation scores (optional category filter).
    const abilityRows = (
      category === 'all'
        ? await sql`
            SELECT a.soc_code, a.element_id, a.element_name, a.category, a.subcategory,
                   a.data_value, a.lower_ci, a.upper_ci, a.n,
                   a.recommend_suppress, a.not_relevant
            FROM onet_abilities a
            WHERE a.soc_code = ANY(${socCodes}) AND a.scale_id = ${scale}
            ORDER BY a.element_id
          `
        : await sql`
            SELECT a.soc_code, a.element_id, a.element_name, a.category, a.subcategory,
                   a.data_value, a.lower_ci, a.upper_ci, a.n,
                   a.recommend_suppress, a.not_relevant
            FROM onet_abilities a
            WHERE a.soc_code = ANY(${socCodes}) AND a.scale_id = ${scale}
              AND a.category = ${category}
            ORDER BY a.element_id
          `
    ) as unknown as AbilityRow[]

    if (abilityRows.length === 0) {
      return NextResponse.json({ abilities: [] } as AbilitiesResponse)
    }

    // major_group_code of the FIRST requested soc code (field band group).
    const occRows = (await sql`
      SELECT soc_code, major_group_code
      FROM onet_occupations
      WHERE soc_code = ANY(${socCodes})
    `) as unknown as OccRow[]
    const occByCode = new Map<string, string | null>()
    for (const o of occRows) occByCode.set(o.soc_code, o.major_group_code)
    const firstMajorGroup = occByCode.get(socCodes[0]) ?? null

    // Query 2 — stats for the elements in play (overall always; major_group
    // only when the first code's group is known — otherwise field stays null).
    const elementIds = [...new Set(abilityRows.map((r) => r.element_id))]
    const statRows = (
      firstMajorGroup
        ? await sql`
            SELECT s.element_id, s.group_type, s.group_code,
                   s.mean_value, s.ci_lower, s.ci_upper, s.occupation_count
            FROM onet_ability_stats s
            WHERE s.element_id = ANY(${elementIds}) AND s.scale_id = ${scale}
              AND (
                (s.group_type = 'overall' AND s.group_code = 'all')
                OR (s.group_type = 'major_group' AND s.group_code = ${firstMajorGroup})
              )
          `
        : await sql`
            SELECT s.element_id, s.group_type, s.group_code,
                   s.mean_value, s.ci_lower, s.ci_upper, s.occupation_count
            FROM onet_ability_stats s
            WHERE s.element_id = ANY(${elementIds}) AND s.scale_id = ${scale}
              AND s.group_type = 'overall' AND s.group_code = 'all'
          `
    ) as unknown as StatRow[]

    const overallByElement = new Map<string, StatRow>()
    const fieldByElement = new Map<string, StatRow>()
    for (const s of statRows) {
      if (s.group_type === 'overall') overallByElement.set(s.element_id, s)
      else if (s.group_type === 'major_group') fieldByElement.set(s.element_id, s)
    }

    // Group per-occupation rows by element, preserving element_id order.
    const elements: AbilityElement[] = []
    const indexByElement = new Map<string, number>()
    for (const r of abilityRows) {
      let idx = indexByElement.get(r.element_id)
      if (idx === undefined) {
        idx = elements.length
        indexByElement.set(r.element_id, idx)
        elements.push({
          element_id: r.element_id,
          element_name: r.element_name,
          category: r.category,
          subcategory: r.subcategory,
          occupations: [],
          overall: toBand(overallByElement.get(r.element_id)),
          field: toBand(fieldByElement.get(r.element_id)),
        })
      }
      elements[idx].occupations.push({
        soc_code: r.soc_code,
        data_value: num(r.data_value),
        lower_ci: num(r.lower_ci),
        upper_ci: num(r.upper_ci),
        n: r.n,
        recommend_suppress: r.recommend_suppress,
        not_relevant: r.not_relevant,
      })
    }

    return NextResponse.json({ abilities: elements } as AbilitiesResponse)
  } catch (err) {
    console.error('[api/onet/abilities] Database error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
