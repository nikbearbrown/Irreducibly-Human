'use client'

import { useTheme } from 'next-themes'

// Occupation legend row carries BOTH palettes so the swatch can flip with the
// theme (Job 1 is near-black in light mode and would vanish on the dark page).
export interface OccLegendItem {
  color: string
  colorDark: string
  label: string
}

// Chrome colors are driven by the site's shadcn CSS vars, which already flip on
// the `.dark` class — so the panel repaints with the rest of the site and needs
// no second toggle.
const panelHeading: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 700,
  color: 'hsl(var(--foreground))',
  margin: '0 0 8px',
}
const panelText: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 14,
  color: 'hsl(var(--muted-foreground))',
  lineHeight: 1.5,
  margin: 0,
}
const legendBox: React.CSSProperties = {
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  padding: '10px 12px',
  marginBottom: 20,
  width: 360,
  maxWidth: '100%',
  boxSizing: 'border-box',
}
const infoBox: React.CSSProperties = {
  borderLeft: '3px solid hsl(var(--primary))',
  background: 'hsl(var(--muted))',
  padding: '6px 10px',
  marginBottom: 20,
}

// Dash patterns mirror what EmploymentChart draws, so the swatch always matches
// the chart. Stroke uses the muted var so it stays legible in both themes.
const LEGEND_ITEMS: { dasharray?: string; opacity?: number; label: string }[] = [
  { dasharray: '2,4', opacity: 0.4, label: 'Data gap (intentional, not missing)' },
  { dasharray: '5,4', label: '2018 baseline (index = 100)' },
]

function LegendRow({
  dasharray,
  opacity,
  label,
  color,
}: {
  dasharray?: string
  opacity?: number
  label: string
  color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <svg width={28} height={10} style={{ flexShrink: 0 }}>
        <line x1={0} y1={5} x2={28} y2={5} stroke={color} strokeWidth={2} strokeDasharray={dasharray} opacity={opacity ?? 1} />
      </svg>
      <span style={panelText}>{label}</span>
    </div>
  )
}

export default function InfoPanel({ occLegend }: { occLegend: OccLegendItem[] }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  // Muted stroke for the non-occupation (dash-pattern) legend rows.
  const dashColor = 'hsl(var(--muted-foreground))'

  return (
    <div style={{ flex: 1, minWidth: 0, paddingTop: 42, position: 'relative', zIndex: 1 }}>
      <div style={legendBox}>
        <div style={panelHeading}>Legend</div>
        {occLegend.map((item, i) => (
          <LegendRow key={`occ-${i}`} color={isDark ? item.colorDark : item.color} label={item.label} />
        ))}
        {LEGEND_ITEMS.map((item, i) => (
          <LegendRow key={i} {...item} color={dashColor} />
        ))}
      </div>
      <div style={infoBox}>
        <div style={panelHeading}>What the index means</div>
        <p style={panelText}>
          Each occupation&apos;s employment is indexed to 2018 = 100, so values compare directly: 48 means employment
          fell to 48% of its 2018 level; 126 means it grew to 126%.
        </p>
      </div>
      <div style={{ ...infoBox, marginBottom: 0 }}>
        <div style={panelHeading}>The milestone timeline</div>
        <p style={panelText}>
          Labels below the axis mark major AI milestones, like model releases and coding-assistant launches, so
          employment shifts can be compared against AI capability jumps.
        </p>
      </div>
    </div>
  )
}
