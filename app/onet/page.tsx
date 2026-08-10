import { headers } from 'next/headers'
import EmploymentChart, { type EmploymentChartData } from './charts/EmploymentChart'
import ProfileChart, { type ProfileChartData } from './charts/ProfileChart'
import OccupationPicker from './OccupationPicker'
import InfoPanel, { type OccLegendItem } from './InfoPanel'

// The AI Exposure Explorer: pick two occupations and compare their employment
// trend against AI milestones (Chart 1) and the human abilities each job leans
// on (Chart 2), through the Irreducibly Human lens of what AI can't replicate.
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'The AI Exposure Explorer — Irreducibly Human',
  description:
    'Compare two occupations: how their employment has moved since 2018 against major AI milestones, and the human abilities each job relies on.',
}

// Tier subtitles are hand-authored for the demo pair only; they key by SOC, so
// any occupation without an entry simply shows no subtitle (auto-drops).
const SUBTITLES: Record<string, string> = {
  '15-1252': 'Tier 4/5 — design, architecture, judgment',
  '15-1251': 'Tier 1 — implementing specifications into code',
}

// Default occupation pair when the URL has no ?soc. Order is positional:
// slot 0 = Job 1 (black), slot 1 = Job 2 (red).
const DEFAULT_SOCS = ['15-1252.00', '15-1251.00'] // Software Developers, Computer Programmers
const JOB_COLORS = ['#0D0D0D', '#8B0000'] // Job 1 black, Job 2 red — positional, occupation-agnostic
// Dark-mode counterparts: Job 1's near-black would vanish on the dark page, so
// it becomes parchment; dried-ink red is muddy on black, so it brightens.
const JOB_COLORS_DARK = ['#E8E0D0', '#E06666']

// Base SOC (strip the ".00" detail suffix) for tolerant matching between the
// URL's codes and whatever format the API echoes back.
const socBase = (s: string) => s.split('.')[0]

// A syntactically valid SOC / O*NET-SOC code: ##-#### with an optional .## detail
// suffix (e.g. "15-1252" or "15-1252.00"). Guards against garbage in ?soc — note
// a *valid* code with no data (e.g. 15-1211.00) still passes here and is handled
// downstream by the no-data notice, not dropped as malformed.
const SOC_RE = /^\d{2}-\d{4}(\.\d{2})?$/

// Inherit the site font (Inter) rather than monospace, to match the rest of the site.
const MONO = 'inherit'

// Chrome colors use the site's shadcn CSS vars, which flip on the `.dark` class
// — so this server component repaints for dark mode with no client hook.
const heading: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'hsl(var(--foreground))',
  margin: '0 0 12px',
}
const divider: React.CSSProperties = { border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '40px 0' }

const panelText: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 14,
  color: 'hsl(var(--muted-foreground))',
  lineHeight: 1.5,
  margin: 0,
}

// Data-source credit shown under each chart.
const sourceNote: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 12,
  color: 'hsl(var(--muted-foreground))',
  marginTop: 10,
}
const SOURCE_TEXT =
  'Built by Abisha Vadukoot, Milivoje (Mickey) Davidovic, and Nik Bear Brown, with data from O*NET and the U.S. Bureau of Labor Statistics (BLS).'

export default async function AIExposureExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ soc?: string }>
}) {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'
  const base = `${proto}://${host}`

  // Selected occupations come from ?soc=A,B (falling back to the demo pair).
  // Capped at 2 — both charts compare a pair.
  const sp = await searchParams
  const seenBase = new Set<string>()
  const parsed = (sp.soc ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SOC_RE.test(s)) // drop empties AND malformed tokens
    .filter((s) => {
      // Dedupe by base code so ?soc=15-1252.00,15-1252 doesn't plot one
      // occupation against itself (both charts compare a distinct pair).
      const b = socBase(s)
      if (seenBase.has(b)) return false
      seenBase.add(b)
      return true
    })
    .slice(0, 2)
  // Nothing valid survived (empty, garbage, or all duplicates) → demo pair.
  const socs = parsed.length ? parsed : DEFAULT_SOCS
  const socParam = socs.join(',')

  const [employmentRes, allRes] = await Promise.all([
    fetch(`${base}/api/onet/employment?soc=${encodeURIComponent(socParam)}`, { cache: 'no-store' }),
    fetch(`${base}/api/onet/abilities?soc=${encodeURIComponent(socParam)}&scale=LV&category=all`, { cache: 'no-store' }),
  ])
  const employment = (await employmentRes.json()) as EmploymentChartData
  const allAbilities = (await allRes.json()) as ProfileChartData

  // Positional colors (Job 1 black, Job 2 red) + titles resolved from the
  // employment series (fall back to the SOC code if an occupation has no
  // employment data). Keyed by the requested SOC so both charts agree.
  const titleBySoc: Record<string, string> = {}
  for (const s of employment.series ?? []) titleBySoc[s.soc_code] = s.title

  // Title fallback: an occupation with no BLS employment data has no title from
  // the employment series, so it would otherwise render as a bare SOC code. Pull
  // those titles from the search API (digit query = SOC-prefix browse). Only the
  // uncovered codes are fetched, in parallel; a failed lookup just leaves the
  // code as its own label (no worse than before).
  const needTitle = socs.filter(
    (soc) => !titleBySoc[soc] && !Object.keys(titleBySoc).some((k) => socBase(k) === socBase(soc))
  )
  if (needTitle.length) {
    const looked = await Promise.all(
      needTitle.map((soc) =>
        fetch(`${base}/api/onet/search?q=${encodeURIComponent(soc)}&limit=5`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : []))
          .then((rows) => ({ soc, rows: (Array.isArray(rows) ? rows : []) as { soc_code: string; title: string }[] }))
          .catch(() => ({ soc, rows: [] as { soc_code: string; title: string }[] }))
      )
    )
    for (const { soc, rows } of looked) {
      const hit = rows.find((r) => r.soc_code === soc) ?? rows.find((r) => socBase(r.soc_code) === socBase(soc))
      if (hit?.title) titleBySoc[hit.soc_code] = hit.title
    }
  }

  const resolveTitle = (soc: string) => {
    if (titleBySoc[soc]) return titleBySoc[soc]
    const hit = Object.keys(titleBySoc).find((k) => socBase(k) === socBase(soc))
    return hit ? titleBySoc[hit] : soc
  }
  const occupationColors: Record<string, string> = {}
  const occupationColorsDark: Record<string, string> = {}
  const occupationTitles: Record<string, string> = {}
  socs.forEach((soc, i) => {
    occupationColors[soc] = JOB_COLORS[i] ?? '#4A4A4A'
    occupationColorsDark[soc] = JOB_COLORS_DARK[i] ?? '#9C9680'
    occupationTitles[soc] = resolveTitle(soc)
  })
  // Legend rows in Job 1 → Job 2 order; carry both palettes so the swatch flips.
  const occLegend: OccLegendItem[] = socs.map((soc, i) => ({
    color: JOB_COLORS[i] ?? '#4A4A4A',
    colorDark: JOB_COLORS_DARK[i] ?? '#9C9680',
    label: resolveTitle(soc),
  }))
  // Current pair for the picker (URL is the source of truth).
  const pickerInitial = socs.map((soc) => ({ soc, title: resolveTitle(soc) }))

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* No max-width cap: each chart is 66.6667vw and its right panel is flex:1
          (relative), so the row needs the full viewport width to fill. */}
      <div>
        {/* Top band: tool summary + the select-two picker together in the wide
            left column (picker sits under the text), with the browse-all
            control alone in the right column. Column widths mirror the chart
            row below. */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 28 }}>
          <div style={{ width: '66.6667vw', maxWidth: '100%', flexShrink: 0 }}>
            {/* Intro heading + how-to summary. */}
            <h1 style={heading}>The AI Exposure Explorer</h1>
            <p style={{ ...panelText, marginBottom: 10 }}>
              Pick two occupations to compare them two ways: how their employment has moved since 2018, set against
              major AI milestones (Chart 1), and the human abilities each job leans on (Chart 2). The lens is the
              Irreducibly Human question of which abilities are hardest for AI to replicate — the{' '}
              <a href="/idea" style={{ color: 'hsl(var(--foreground))', textDecoration: 'underline' }}>
                seven-tier taxonomy
              </a>{' '}
              explains the idea behind the tool.
            </p>
            <ul style={{ ...panelText, margin: '0 0 14px', paddingLeft: 18, listStyleType: 'disc' }}>
              <li style={{ display: 'list-item', marginBottom: 3 }}>
                Choose two occupations with the selector below (search by role name or SOC code).
              </li>
              <li style={{ display: 'list-item', marginBottom: 3 }}>
                In Chart 2, switch between COMPARISON and TOP DIFFERENCES, browse the ability categories, and open
                the Glossary for any unfamiliar term.
              </li>
              <li style={{ display: 'list-item' }}>Hover any point for its exact values.</li>
            </ul>
            <OccupationPicker initial={pickerInitial} show="picker" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <OccupationPicker initial={pickerInitial} show="browse" />
          </div>
        </div>
        <h2 style={heading}>Chart 1 — Employment</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: '66.6667vw', maxWidth: '100%', flexShrink: 0 }}>
            <EmploymentChart
              data={employment}
              subtitles={SUBTITLES}
              occupationColors={occupationColors}
              occupationColorsDark={occupationColorsDark}
              responsiveScale
            />
          </div>
          <InfoPanel occLegend={occLegend} />
        </div>
        <div style={sourceNote}>{SOURCE_TEXT}</div>

        <hr style={divider} />
        <h2 style={heading}>Chart 2 — Abilities</h2>
        <ProfileChart
          data={allAbilities}
          occupationColors={occupationColors}
          occupationColorsDark={occupationColorsDark}
          occupationTitles={occupationTitles}
          title="Abilities"
          scale="LV"
          scaleMin={0}
          scaleMax={7}
        />
        <div style={sourceNote}>{SOURCE_TEXT}</div>
      </div>
    </div>
  )
}
