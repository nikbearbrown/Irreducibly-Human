'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useTheme } from 'next-themes'
import {
  GLOSSARY_ENTRIES,
  lookupDefinition,
  lookupCategoryThesis,
  VIEW_FRAMING,
  CHART_THESIS_INTRO,
  DIFFERENCES_ABOUT,
  DIFFERENCES_FOOTNOTE,
} from '@/lib/onet-glossary'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ProfileOccupation {
  soc_code: string
  data_value: number | null
  lower_ci: number | null
  upper_ci: number | null
  n: number | null
  recommend_suppress: boolean
  not_relevant: boolean | null
}
export interface ProfileBand {
  mean_value: number
  ci_lower: number
  ci_upper: number
  occupation_count: number
}
export interface ProfileAbility {
  element_id: string
  element_name: string
  category: string
  subcategory: string
  occupations: ProfileOccupation[]
  overall: ProfileBand | null
  field: ProfileBand | null
}
export interface ProfileChartData {
  abilities: ProfileAbility[]
}
export interface ProfileChartProps {
  data: ProfileChartData
  occupationColors: Record<string, string>
  // Dark-mode occupation palette (Job 1's near-black would vanish on the dark
  // background). Picked when the theme is dark; keys match occupationColors.
  occupationColorsDark?: Record<string, string>
  title: string
  scale?: 'LV' | 'IM'
  scaleMin?: number
  scaleMax?: number
  referenceSocCode?: string
  occupationTitles?: Record<string, string>
}

// Inherit the site font (Inter, applied on <body> via next/font) rather than
// hardcode a family — matches the rest of the site. Name kept for brevity.
const MONO = 'inherit'
const ROW_H_BASE = 30
const HEADER_GAP_BASE = 8
const HEADER_H_BASE = 28
const JITTER = [-4, 4, 0, -8, 8] // vertical offset per occupation index (differences view only)

// Relative sizing: dimensions below are tuned at REFERENCE_WIDTH and scaled by
// container width (clamped) so margins/fonts/rows stay proportioned instead of
// fixed. Mirrors the approach used in EmploymentChart.
const REFERENCE_WIDTH = 900
const MIN_SCALE = 0.85
const MAX_SCALE = 1.15
const clampScale = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

type RenderRow = { type: 'header'; category: string; y: number } | { type: 'row'; ability: ProfileAbility; y: number }

interface TipState {
  visible: boolean
  left: number
  top: number
  title: string
  lines: string[]
}

const truncate = (s: string, n = 22) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const fmt = (n: number | null | undefined) => (n == null ? '—' : (Math.round(n * 100) / 100).toFixed(2))
const signedFmt = (n: number | null | undefined) =>
  n == null ? '—' : n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(Math.abs(n))}` : fmt(0)

export default function ProfileChart({
  data,
  occupationColors,
  occupationColorsDark,
  title,
  scale = 'LV',
  scaleMin,
  scaleMax,
  referenceSocCode,
  occupationTitles,
}: ProfileChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartColRef = useRef<HTMLDivElement | null>(null)
  const leftHeaderRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const axisSvgRef = useRef<SVGSVGElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number>(900)
  const [viewMode, setViewMode] = useState<'comparison' | 'differences'>('comparison')
  // Pixel height of the TOP DIFFERENCES scroll window (~10 rows), measured in the
  // draw effect off the scaled row height so ~10 rows show before scrolling.
  const [deltaScrollH, setDeltaScrollH] = useState<number>(0)
  // Same, for the COMPARISON body; 0 = no cap (fewer than ~10 rows, show all).
  const [compScrollH, setCompScrollH] = useState<number>(0)
  // Glossary drawer: open state + search query (also used as the "filter to this
  // term" mechanism when a "?" / label is clicked — it just seeds the query).
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [glossaryQuery, setGlossaryQuery] = useState('')
  // Height of the left column's above-chart controls (toggle + tabs + note), so
  // the right panel's legend can start level with the chart's scroll body.
  const [leftHeaderH, setLeftHeaderH] = useState(0)
  const [tip, setTip] = useState<TipState>({
    visible: false, left: 0, top: 0, title: '', lines: [],
  })

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  // Theme-correct occupation palette for color VALUES (keys still come from
  // occupationColors, which the dark map mirrors).
  const occColors = (isDark && occupationColorsDark) || occupationColors

  // Distinct occupation soc_codes — computed in the body (cheap, prop-derived)
  // so both the JSX toggle and the draw effect read a fresh, consistent value.
  const distinctSocCodes = useMemo(
    () => Array.from(new Set(data.abilities.flatMap((a) => a.occupations.map((o) => o.soc_code)))),
    [data]
  )

  // Distinct categories in first-appearance order — drives the COMPARISON view's
  // inner category tabs. Shared by JSX + draw effect so they stay consistent.
  const categories = useMemo(() => {
    const seen: string[] = []
    for (const a of data.abilities) if (a.category && !seen.includes(a.category)) seen.push(a.category)
    return seen
  }, [data])

  // Selected category for the COMPARISON tabs. Resolved against the live list so
  // a stale value (or the initial '') falls back to Cognitive, else the first.
  const [activeCategory, setActiveCategory] = useState<string>('')
  const effectiveCategory = categories.includes(activeCategory)
    ? activeCategory
    : categories.includes('cognitive')
      ? 'cognitive'
      : (categories[0] ?? '')
  const showCategoryTabs = categories.length > 1
  // The delta (TOP DIFFERENCES) view is active only with exactly 2 occupations
  // and enough width; otherwise the COMPARISON dumbbell is showing.
  const deltaActive = viewMode === 'differences' && distinctSocCodes.length === 2 && measuredWidth >= 700

  // Reference / comparison resolution mirrored in the body so the HTML delta
  // header can label the same occupations the draw effect uses.
  const resolvedRefBody = (() => {
    const candidate = referenceSocCode ?? Object.keys(occupationColors)[0]
    return distinctSocCodes.includes(candidate) ? candidate : (distinctSocCodes[0] ?? null)
  })()
  const resolvedCompBody = resolvedRefBody
    ? (distinctSocCodes.find((c) => c !== resolvedRefBody) ?? null)
    : null

  // Picked occupations with NO usable ability value (every row null or
  // suppressed) — O*NET simply has no ability profile for them. Without a notice
  // the dot-plot renders with a missing/half-missing series and reads as a bug.
  // Parallel to EmploymentChart's no-data notice. Requested socs come from the
  // color map (the page's source of truth); matching is base-tolerant.
  const noAbilityData = useMemo(() => {
    const base = (s: string) => s.split('.')[0]
    const requested = Object.keys(occupationColors)
    const count = new Map<string, number>(requested.map((s) => [s, 0]))
    for (const ab of data.abilities) {
      for (const o of ab.occupations) {
        if (o.data_value == null || o.recommend_suppress) continue
        const key = count.has(o.soc_code)
          ? o.soc_code
          : requested.find((r) => base(r) === base(o.soc_code))
        if (key) count.set(key, (count.get(key) ?? 0) + 1)
      }
    }
    return requested
      .filter((soc) => (count.get(soc) ?? 0) === 0)
      .map((soc) => ({ soc, title: occupationTitles?.[soc] ?? soc, color: occColors[soc] }))
  }, [data, occupationColors, occColors, occupationTitles])

  // Open the glossary drawer, optionally seeded to a specific term.
  const openGlossary = (term?: string) => {
    setGlossaryQuery(term ?? '')
    setGlossaryOpen(true)
  }

  // Scale labelling for the footnote (kept in sync with the draw effect).
  const scaleIsIM = scale === 'IM'
  const scaleLabel = scaleIsIM ? 'Importance' : 'Level'
  const scaleLo = scaleMin ?? (scaleIsIM ? 1 : 0)
  const scaleHi = scaleMax ?? (scaleIsIM ? 5 : 7)

  // Responsive width — measured off the left chart column (not the full
  // container), since the SVG now shares the row with a right-hand panel.
  useEffect(() => {
    const el = chartColRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setMeasuredWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Track the left header height so the right panel can align to the chart body.
  useEffect(() => {
    const el = leftHeaderRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setLeftHeaderH(el.offsetHeight))
    ro.observe(el)
    setLeftHeaderH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const width = measuredWidth
    if (!svgRef.current || width <= 0) return

    const sf = clampScale(width / REFERENCE_WIDTH, MIN_SCALE, MAX_SCALE)
    const px = (base: number, min: number) => Math.max(min, Math.round(base * sf * 10) / 10)
    const ROW_H = px(ROW_H_BASE, 24)
    const HEADER_GAP = px(HEADER_GAP_BASE, 6)
    const HEADER_H = px(HEADER_H_BASE, 22)

    const showDelta = viewMode === 'differences' && distinctSocCodes.length === 2 && width >= 700
    // Comparison (dumbbell) renders whenever the delta view isn't active — so a
    // stale 'differences' selection with <2 occupations falls back cleanly here
    // rather than to the old band+jitter layout.
    const isComparison = !showDelta
    const resolvedRef = (() => {
      const candidate = referenceSocCode ?? Object.keys(occupationColors)[0]
      return distinctSocCodes.includes(candidate) ? candidate : (distinctSocCodes[0] ?? null)
    })()
    const resolvedComp = resolvedRef ? (distinctSocCodes.find((c) => c !== resolvedRef) ?? null) : null

    const isIM = scale === 'IM'
    const xMin = scaleMin ?? (isIM ? 1 : 0)
    const xMax = scaleMax ?? (isIM ? 5 : 7)
    // High-end axis marker. For the LV (Level) scale it reads as the degree of
    // the ability the job needs: MINIMAL (near 0, shaded) → ADVANCED (near max).
    const xLabel = isIM ? `Importance (${xMin}–${xMax})` : 'ADVANCED'

    // Effect-local copy (kept out of the dep array to avoid re-render churn from
    // a fresh object ref each render; occupationColorsDark is in the deps below).
    const occColors = (isDark && occupationColorsDark) || occupationColors
    const fg = isDark ? '#E8E0D0' : '#0D0D0D'
    const muted = isDark ? '#9C9680' : '#6B6B5E'
    const axisColor = isDark ? '#4A4A4A' : '#9C9680'
    const gridColor = isDark ? '#1F1F1F' : '#EEEAE0'
    const bandOverall = isDark ? '#1C1C1C' : '#F0EFED'
    const bandField = isDark ? '#2A2A2A' : '#E0DEDB'
    const borderOverall = isDark ? '#2A2A2A' : '#D8D6D3'
    const borderField = isDark ? '#3A3A3A' : '#C8C5C1'
    const meanLine = isDark ? '#6B6B5E' : '#9C9680'
    const bg = isDark ? '#0D0D0D' : '#FFFFFF'
    const altShade = isDark ? '#181818' : '#F5F3F0' // zebra row resting shade
    const rowHover = isDark ? '#2A2A2A' : '#E8E0D0' // active-row hover highlight

    // Per-row delta (reference − comparison); null when either side is missing/suppressed.
    const deltaMap = new Map<string, number | null>()
    if (showDelta && resolvedRef) {
      for (const ab of data.abilities) {
        const ref = ab.occupations.find((o) => o.soc_code === resolvedRef)
        const comp = ab.occupations.find((o) => o.soc_code !== resolvedRef)
        const refVal = ref?.data_value ?? null
        const compVal = comp?.data_value ?? null
        if (
          refVal == null || compVal == null ||
          ref?.recommend_suppress || comp?.recommend_suppress ||
          ref?.not_relevant || comp?.not_relevant
        ) {
          deltaMap.set(ab.element_id, null)
        } else {
          deltaMap.set(ab.element_id, refVal - compVal)
        }
      }
    }
    // Symmetric delta axis max across ALL rows (floored at 0.5), before filtering.
    const maxAbsDelta = showDelta
      ? Math.max(
          0.5,
          ...Array.from(deltaMap.values())
            .filter((d): d is number => d !== null)
            .map(Math.abs)
        )
      : 0

    // ============================================================
    // TOP DIFFERENCES — full-width diverging bar chart (scrollable).
    // Self-contained render path: no CI bands, no main LV/IM axis, no side
    // column. Rows are ALL abilities ranked by |delta|; the header/legend lives
    // in HTML above the scroll body (see JSX), so this SVG is just bars.
    // ============================================================
    if (showDelta && resolvedRef && resolvedComp) {
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const refSoc = resolvedRef
      const compSoc = resolvedComp
      const refColor = occColors[refSoc] ?? muted
      const compColor = occColors[compSoc] ?? muted

      // Rank every ability by gap size; null (missing/suppressed) deltas sink.
      const ranked = [...data.abilities].sort((a, b) => {
        const da = deltaMap.get(a.element_id)
        const db = deltaMap.get(b.element_id)
        const aa = da == null ? -1 : Math.abs(da)
        const bb = db == null ? -1 : Math.abs(db)
        if (bb !== aa) return bb - aa
        return a.element_name.localeCompare(b.element_name)
      })

      const dMargin = { top: px(10, 8), right: px(56, 44), bottom: px(10, 8), left: px(230, 160) }
      const rowH = ROW_H
      const innerH = ranked.length * rowH
      const height = dMargin.top + innerH + dMargin.bottom

      svg
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height)
        .style('background', bg)

      // Reserve a gutter at each end so a full-length bar's value label stays
      // inside the plot instead of spilling onto the ability labels / edge.
      const LABEL_PAD = px(52, 44)
      const barsX0 = dMargin.left + LABEL_PAD
      const barsX1 = width - dMargin.right - LABEL_PAD
      const centerX = (barsX0 + barsX1) / 2
      const dScale = d3.scaleLinear().domain([-maxAbsDelta, maxAbsDelta]).range([barsX0, barsX1])

      const root = svg.append('g').attr('transform', `translate(0,${dMargin.top})`)
      root.style('pointer-events', 'none')

      const hl = (id: string, on: boolean) => {
        const r = svg.select(`[data-rowbg="${id}"]`)
        if (!r.empty()) r.attr('fill', on ? rowHover : (r.attr('data-basefill') || 'transparent'))
      }

      ranked.forEach((ab, idx) => {
        const rowY = idx * rowH
        const cy = rowY + rowH / 2
        const delta = deltaMap.get(ab.element_id) ?? null
        const ref = ab.occupations.find((o) => o.soc_code === refSoc)
        const comp = ab.occupations.find((o) => o.soc_code === compSoc)
        const ciOverlap =
          ref?.lower_ci == null || ref?.upper_ci == null || comp?.lower_ci == null || comp?.upper_ci == null
            ? true
            : ref.lower_ci <= comp.upper_ci && comp.lower_ci <= ref.upper_ci

        // Zebra background + hover hit target (whole row).
        const baseFill = idx % 2 === 1 ? altShade : 'transparent'
        root
          .append('rect')
          .attr('data-rowbg', ab.element_id)
          .attr('data-basefill', baseFill)
          .attr('x', 8)
          .attr('y', rowY)
          .attr('width', Math.max(0, width - dMargin.right - 8))
          .attr('height', rowH)
          .attr('fill', baseFill)
          .style('cursor', 'pointer')
          .style('pointer-events', 'all')
          .on('mouseenter', (event: MouseEvent) => {
            hl(ab.element_id, true)
            const refTitle = (occupationTitles?.[refSoc] ?? refSoc).slice(0, 18)
            const compTitle = (occupationTitles?.[compSoc] ?? compSoc).slice(0, 18)
            const lines = [
              `${refTitle}: ${fmt(ref?.data_value ?? null)} (n=${ref?.n ?? '—'})`,
              `${compTitle}: ${fmt(comp?.data_value ?? null)} (n=${comp?.n ?? '—'})`,
              delta == null
                ? 'Difference: — (missing data)'
                : `Difference: ${signedFmt(delta)}${ciOverlap ? ' (CIs overlap — may be noise)' : ''}`,
            ]
            const rect = containerRef.current?.getBoundingClientRect()
            let left = event.clientX - (rect?.left ?? 0) + 14
            if (left + 260 > measuredWidth) left = event.clientX - (rect?.left ?? 0) - 274
            setTip({
              visible: true,
              left: Math.max(4, left),
              top: event.clientY - (rect?.top ?? 0) + 14,
              title: ab.element_name,
              lines,
            })
          })
          .on('mouseleave', () => {
            hl(ab.element_id, false)
            setTip((t) => ({ ...t, visible: false }))
          })

        // Ability label (left).
        root
          .append('text')
          .attr('x', dMargin.left - 8)
          .attr('y', cy)
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', 'end')
          .attr('font-family', MONO)
          .attr('font-size', px(14, 13))
          .attr('fill', fg)
          .text(truncate(ab.element_name))

        if (delta === null) {
          root
            .append('line')
            .attr('x1', centerX - 4)
            .attr('x2', centerX + 4)
            .attr('y1', cy)
            .attr('y2', cy)
            .attr('stroke', muted)
            .attr('stroke-width', 1)
          return
        }

        // Diverging bar: right = reference higher, left = comparison higher.
        const barColor = delta > 0 ? refColor : compColor
        const barX = delta > 0 ? centerX : dScale(delta)
        const barW = Math.max(1, Math.abs(dScale(delta) - centerX))
        const barH = px(13, 11)
        const bar = root.append('rect').attr('x', barX).attr('y', cy - barH / 2).attr('width', barW).attr('height', barH)
        if (ciOverlap) bar.attr('fill', 'none').attr('stroke', barColor).attr('stroke-width', 1.5)
        else bar.attr('fill', barColor).attr('stroke', 'none')

        // Value label just past the bar end (with ~ when CIs overlap).
        root
          .append('text')
          .attr('x', delta > 0 ? dScale(delta) + 4 : dScale(delta) - 4)
          .attr('y', cy)
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', delta > 0 ? 'start' : 'end')
          .attr('font-family', MONO)
          .attr('font-size', px(12, 11))
          .attr('fill', muted)
          .text(`${signedFmt(delta)}${ciOverlap ? '~' : ''}`)
      })

      // Zero center-line through all rows.
      root
        .append('line')
        .attr('x1', centerX)
        .attr('x2', centerX)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', axisColor)
        .attr('stroke-width', 1)

      setDeltaScrollH(Math.round(dMargin.top + Math.min(ranked.length, 15) * rowH + 4))
      return
    }

    // Comparison body margins. Title/legend (HTML above) and x-axis (fixed SVG
    // below) are outside this body, so top/bottom just need small padding.
    const RIGHT_PAD = px(72, 52)
    const margin = {
      top: px(12, 10),
      right: RIGHT_PAD,
      bottom: px(10, 8),
      left: px(230, 160),
    }

    const sorted = [...data.abilities].sort(
      (a, b) => (b.overall?.mean_value ?? -Infinity) - (a.overall?.mean_value ?? -Infinity)
    )

    const items: RenderRow[] = []
    let yc = 0

    if (showDelta) {
      // Difference mode: flat top-15 by absolute delta, no category headers
      const ranked = [...sorted].sort((a, b) => {
        const da = Math.abs(deltaMap.get(a.element_id) ?? 0)
        const db = Math.abs(deltaMap.get(b.element_id) ?? 0)
        if (db !== da) return db - da
        const ma = a.overall?.mean_value ?? 0
        const mb = b.overall?.mean_value ?? 0
        if (mb !== ma) return mb - ma
        return a.element_id.localeCompare(b.element_id)
      })
      const top15 = ranked.slice(0, 15)
      for (const ab of top15) {
        items.push({ type: 'row', ability: ab, y: yc })
        yc += ROW_H
      }
    } else {
      // Comparison view: grouped by category with section headers. Within each
      // category, rows are ordered by the size of the gap between the two
      // occupations (biggest first); with a single occupation, by its value.
      const cmpKey = (ab: ProfileAbility): number => {
        const ref = resolvedRef ? ab.occupations.find((o) => o.soc_code === resolvedRef) : null
        const comp = resolvedComp ? ab.occupations.find((o) => o.soc_code === resolvedComp) : null
        if (resolvedComp) {
          if (ref?.data_value == null || comp?.data_value == null) return -1
          return Math.abs(ref.data_value - comp.data_value)
        }
        return ref?.data_value ?? -1
      }
      const categoryOrder: string[] = []
      for (const r of sorted) {
        if (!categoryOrder.includes(r.category)) categoryOrder.push(r.category)
      }
      // With more than one category present, the inner tabs show a single
      // category at a time; otherwise render the sole category as-is.
      const catsToRender =
        categoryOrder.length > 1 ? categoryOrder.filter((c) => c === effectiveCategory) : categoryOrder
      for (const cat of catsToRender) {
        yc += HEADER_GAP
        items.push({ type: 'header', category: cat, y: yc })
        yc += HEADER_H
        const catRows = sorted
          .filter((r) => r.category === cat)
          .sort((a, b) => cmpKey(b) - cmpKey(a) || a.element_name.localeCompare(b.element_name))
        for (const ab of catRows) {
          items.push({ type: 'row', ability: ab, y: yc })
          yc += ROW_H
        }
      }
    }

    const innerH = yc
    const height = margin.top + innerH + margin.bottom

    // Category pills only carry information when >1 category is visible
    // (e.g. category=all). With a single category they're redundant → suppress.
    const rowCats = new Set<string>()
    for (const it of items) if (it.type === 'row') rowCats.add(it.ability.category)
    const showPills = showDelta && rowCats.size > 1

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height).style('background', bg)
    // Comparison title + legend now live in fixed HTML above the scroll body,
    // and the x-axis in a fixed SVG below it (see JSX), so the row body can
    // scroll while both stay visible.

    const root = svg.append('g').attr('transform', `translate(0,${margin.top})`)
    // Decorative content is non-interactive; only the zebra rows, dots and the delta
    // hit-target re-enable pointer events below. Keeps hover hit-testing predictable
    // (events fall through bands/labels to the full-width zebra rect behind them).
    root.style('pointer-events', 'none')

    // Imperative row highlight — mutates the row's background rect directly via D3
    // (NOT React state) so hovering never re-runs this effect / redraws the SVG.
    function highlightRow(elementId: string, on: boolean) {
      const r = svg.select(`[data-rowbg="${elementId}"]`)
      if (r.empty()) return
      r.attr('fill', on ? rowHover : (r.attr('data-basefill') || 'transparent'))
    }

    // ----- PASS 0: alternating row backgrounds (zebra), behind everything -----
    // Every ability row gets a rect (transparent on non-shaded rows) so the hover
    // highlight always has a target; data-basefill stores the resting color.
    {
      const shadeX0 = 8
      const shadeX1 = width - margin.right
      let zebraIdx = 0
      for (const it of items) {
        if (it.type !== 'row') continue
        const baseFill = zebraIdx % 2 === 1 ? altShade : 'transparent'
        zebraIdx++
        const id = it.ability.element_id
        root
          .append('rect')
          .attr('data-rowbg', id)
          .attr('data-basefill', baseFill)
          .attr('x', shadeX0)
          .attr('y', it.y)
          .attr('width', shadeX1 - shadeX0)
          .attr('height', ROW_H)
          .attr('fill', baseFill)
          .style('pointer-events', 'all')
          .on('mouseenter', () => highlightRow(id, true))
          .on('mouseleave', () => highlightRow(id, false))
      }
    }

    const x = d3.scaleLinear().domain([xMin, xMax]).range([margin.left, width - margin.right])
    const ticks = d3.range(Math.ceil(xMin), Math.floor(xMax) + 1)

    // Gridlines (behind everything)
    root
      .append('g')
      .selectAll('line')
      .data(ticks)
      .join('line')
      .attr('x1', (t) => x(t))
      .attr('x2', (t) => x(t))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', gridColor)
      .attr('stroke-width', 1)

    // Not-required zone: light gray shaded area from 0 to 0.5 (LV only; guard skips IM).
    const nrX = x(xMin)
    const nrWidth = Math.max(0, x(0.5) - x(xMin))
    if (nrWidth > 0) {
      root
        .append('rect')
        .attr('x', nrX)
        .attr('y', 0)
        .attr('width', nrWidth)
        .attr('height', innerH)
        .attr('fill', bandOverall)
        .attr('opacity', 0.25)
      // NOT REQUIRED label is drawn on the fixed axis SVG below (see end of
      // this branch), so it stays visible while the row body scrolls.
    }

    // ----- PASS A: bands, mean lines, row labels, category headers -----
    for (const it of items) {
      if (it.type === 'header') {
        root
          .append('text')
          .attr('x', margin.left)
          .attr('y', it.y + 6)
          .attr('font-family', MONO)
          .attr('font-size', 12)
          .attr('letter-spacing', '0.12em')
          .attr('fill', muted)
          .text(it.category.toUpperCase())
        root
          .append('line')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', it.y + 12)
          .attr('y2', it.y + 12)
          .attr('stroke', gridColor)
          .attr('stroke-width', 1)
        continue
      }
      const ab = it.ability
      const cy = it.y

      if (isComparison) {
        // Dumbbell view: no CI bands. A short vertical tick marks the overall
        // workforce mean for reference (explained in the footnote).
        if (ab.overall) {
          root
            .append('line')
            .attr('x1', x(ab.overall.mean_value))
            .attr('x2', x(ab.overall.mean_value))
            .attr('y1', cy + ROW_H * 0.22)
            .attr('y2', cy + ROW_H * 0.78)
            .attr('stroke', meanLine)
            .attr('stroke-width', 1)
        }
      } else {
        if (ab.overall) {
          root
            .append('rect')
            .attr('x', x(ab.overall.ci_lower))
            .attr('y', cy)
            .attr('width', Math.max(0, x(ab.overall.ci_upper) - x(ab.overall.ci_lower)))
            .attr('height', ROW_H)
            .attr('fill', bandOverall)
            .attr('opacity', 0.6)
            .attr('stroke', borderOverall)
            .attr('stroke-width', 1)
        }
        if (ab.field) {
          root
            .append('rect')
            .attr('x', x(ab.field.ci_lower))
            .attr('y', cy)
            .attr('width', Math.max(0, x(ab.field.ci_upper) - x(ab.field.ci_lower)))
            .attr('height', ROW_H)
            .attr('fill', bandField)
            .attr('opacity', 0.8)
            .attr('stroke', borderField)
            .attr('stroke-width', 1)
        }
        if (ab.overall) {
          root
            .append('line')
            .attr('x1', x(ab.overall.mean_value))
            .attr('x2', x(ab.overall.mean_value))
            .attr('y1', cy)
            .attr('y2', cy + ROW_H)
            .attr('stroke', meanLine)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
        }
      }

      // Row label
      if (showPills) {
        // Difference mode, mixed categories: ability name + category pill (2 lines)
        // (reuses the outer `cy = it.y`)
        root
          .append('text')
          .attr('x', margin.left - 8)
          .attr('y', cy + ROW_H / 2 - 3)
          .attr('dominant-baseline', 'auto')
          .attr('text-anchor', 'end')
          .attr('font-family', MONO)
          .attr('font-size', 14)
          .attr('fill', fg)
          .text(truncate(ab.element_name))

        const pillText = ab.category.toUpperCase()
        const pillWidth = Math.round(pillText.length * 8 * 0.6 + 10)
        const pillHeight = 11
        const pillY = cy + ROW_H / 2 + 3
        const pillX = margin.left - 8 - pillWidth

        root
          .append('rect')
          .attr('x', pillX)
          .attr('y', pillY)
          .attr('width', pillWidth)
          .attr('height', pillHeight)
          .attr('fill', bandOverall)
          .attr('stroke', borderOverall)
          .attr('stroke-width', 1)
          .attr('rx', 0)

        root
          .append('text')
          .attr('x', margin.left - 8 - 5)
          .attr('y', pillY + pillHeight - 2)
          .attr('text-anchor', 'end')
          .attr('font-family', MONO)
          .attr('font-size', 12)
          .attr('letter-spacing', '0.08em')
          .attr('fill', muted)
          .text(pillText)
      } else {
        // Comparison view: single centered ability label.
        root
          .append('text')
          .attr('x', margin.left - 8)
          .attr('y', it.y + ROW_H / 2)
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', 'end')
          .attr('font-family', MONO)
          .attr('font-size', 14)
          .attr('fill', fg)
          .text(truncate(ab.element_name))

        // Label-zone tap-target: hover previews the plain-language definition,
        // click opens the glossary drawer seeded to this ability.
        const def = lookupDefinition(ab.element_name)
        if (def) {
          root
            .append('rect')
            .attr('x', 6)
            .attr('y', it.y)
            .attr('width', Math.max(0, margin.left - 12))
            .attr('height', ROW_H)
            .attr('fill', 'transparent')
            .style('cursor', 'help')
            .style('pointer-events', 'all')
            .on('mouseenter', (event: MouseEvent) => {
              highlightRow(ab.element_id, true)
              const rect = containerRef.current?.getBoundingClientRect()
              let left = event.clientX - (rect?.left ?? 0) + 14
              if (left + 260 > (rect?.width ?? width)) left = event.clientX - (rect?.left ?? 0) - 274
              setTip({
                visible: true,
                left: Math.max(4, left),
                top: event.clientY - (rect?.top ?? 0) + 14,
                title: ab.element_name,
                lines: [def, '', 'Click for glossary'],
              })
            })
            .on('mouseleave', () => {
              highlightRow(ab.element_id, false)
              setTip((t) => ({ ...t, visible: false }))
            })
            .on('click', () => {
              setGlossaryQuery(ab.element_name)
              setGlossaryOpen(true)
            })
        }
      }
    }

    // ----- PASS B: per-occupation dots (+ dumbbell connectors / whiskers) -----
    // Shared dot renderer. In comparison view the CI whisker is drawn only on
    // hover (hoverWhisker=true) to keep rows clean; differences view keeps its
    // always-on whisker drawn separately below.
    const drawDot = (ab: ProfileAbility, o: ProfileOccupation, oy: number, hoverWhisker: boolean) => {
      const color = occColors[o.soc_code] ?? muted
      const dot = root
        .append('circle')
        .attr('cx', x(o.data_value as number))
        .attr('cy', oy)
        .attr('r', px(6, 5))
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
      if (o.not_relevant) {
        dot.attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5).attr('opacity', 0.4)
      } else {
        dot.attr('fill', color)
      }

      let whisker: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null
      dot
        .on('mouseenter', (event: MouseEvent) => {
          highlightRow(ab.element_id, true)
          if (hoverWhisker && o.lower_ci != null && o.upper_ci != null) {
            whisker = root
              .append('line')
              .attr('x1', x(o.lower_ci))
              .attr('x2', x(o.upper_ci))
              .attr('y1', oy)
              .attr('y2', oy)
              .attr('stroke', color)
              .attr('stroke-width', 1.5)
              .attr('opacity', 0.7)
          }
          const ciPart =
            o.lower_ci != null && o.upper_ci != null
              ? ` (CI: ${fmt(o.lower_ci)}–${fmt(o.upper_ci)}, n=${o.n ?? '—'})`
              : ''
          const lines = [
            `Occupation: ${occupationTitles?.[o.soc_code] ?? o.soc_code}`,
            `Value: ${fmt(o.data_value)}${ciPart}`,
            ab.overall ? `Overall mean: ${fmt(ab.overall.mean_value)}` : 'Overall mean: —',
            ...(ab.field ? [`Field mean: ${fmt(ab.field.mean_value)}`] : []),
          ]
          // Position next to the cursor (relative to the container) so the tip
          // stays with the mouse even when the row body is scrolled.
          const rect = containerRef.current?.getBoundingClientRect()
          let left = event.clientX - (rect?.left ?? 0) + 14
          if (left + 260 > (rect?.width ?? width)) left = event.clientX - (rect?.left ?? 0) - 274
          setTip({
            visible: true,
            left: Math.max(4, left),
            top: event.clientY - (rect?.top ?? 0) + 14,
            title: ab.element_name,
            lines,
          })
        })
        .on('mouseleave', () => {
          highlightRow(ab.element_id, false)
          if (whisker) {
            whisker.remove()
            whisker = null
          }
          setTip((t) => ({ ...t, visible: false }))
        })
    }

    for (const it of items) {
      if (it.type !== 'row') continue
      const ab = it.ability
      const cy = it.y + ROW_H / 2

      if (isComparison) {
        // Dumbbell: dots sit at the true row center (no jitter), connected by a
        // neutral line whose length is the gap between the two occupations.
        const valid = ab.occupations.filter((o) => !o.recommend_suppress && o.data_value != null)
        if (valid.length >= 2) {
          const xs = valid.map((o) => x(o.data_value as number))
          root
            .append('line')
            .attr('x1', Math.min(...xs))
            .attr('x2', Math.max(...xs))
            .attr('y1', cy)
            .attr('y2', cy)
            .attr('stroke', axisColor)
            .attr('stroke-width', px(2, 1.5))
            .attr('opacity', 0.6)
        }
        for (const o of valid) drawDot(ab, o, cy, true)
      } else {
        ab.occupations.forEach((o, i) => {
          if (o.recommend_suppress) return
          if (o.data_value == null) return
          const color = occColors[o.soc_code] ?? muted
          const oy = cy + (JITTER[i] ?? (i % 2 === 0 ? -4 : 4))
          if (o.lower_ci != null && o.upper_ci != null) {
            root
              .append('line')
              .attr('x1', x(o.lower_ci))
              .attr('x2', x(o.upper_ci))
              .attr('y1', oy)
              .attr('y2', oy)
              .attr('stroke', color)
              .attr('stroke-width', 1.5)
              .attr('opacity', 0.7)
          }
          drawDot(ab, o, oy, false)
        })
      }
    }

    // ----- Fixed X axis (its own SVG below the scroll body) + NOT REQUIRED -----
    const axisH = px(48, 40)
    const axisSvg = d3.select(axisSvgRef.current)
    axisSvg.selectAll('*').remove()
    axisSvg.attr('viewBox', `0 0 ${width} ${axisH}`).attr('width', width).attr('height', axisH).style('background', bg)
    const xAxis = d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')).tickSize(5)
    const xg = axisSvg.append('g').attr('transform', 'translate(0,1)').call(xAxis)
    xg.selectAll('text').attr('font-family', MONO).attr('font-size', 14).attr('fill', fg)
    xg.selectAll('line').attr('stroke', axisColor)
    xg.select('.domain').attr('stroke', axisColor)
    axisSvg
      .append('text')
      .attr('x', width - margin.right)
      .attr('y', axisH - 4)
      .attr('text-anchor', 'end')
      .attr('font-family', MONO)
      .attr('font-size', 12)
      .attr('letter-spacing', '0.08em')
      .attr('fill', muted)
      .text(xLabel)
    const nrLabelW = Math.max(0, x(0.5) - x(xMin))
    if (nrLabelW > 0) {
      axisSvg
        .append('text')
        .attr('x', x(xMin))
        .attr('y', axisH - 4)
        .attr('text-anchor', 'start')
        .attr('font-family', MONO)
        .attr('font-size', 12)
        .attr('letter-spacing', '0.08em')
        .attr('fill', muted)
        .text('MINIMAL')
    }

    // Scroll the body when the active category has more than 10 rows; 0 = no cap.
    const rowCount = items.filter((it) => it.type === 'row').length
    setCompScrollH(
      rowCount > 10 ? Math.round(margin.top + HEADER_GAP + HEADER_H + 10 * ROW_H + margin.bottom) : 0
    )
  }, [data, occupationColors, occupationColorsDark, occupationTitles, title, scale, scaleMin, scaleMax, measuredWidth, isDark, viewMode, referenceSocCode, distinctSocCodes, effectiveCategory])

  const panelBorder = isDark ? '#4A4A4A' : '#9C9680'
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* ===== LEFT: bordered chart box + footnotes (outside the box) ===== */}
        <div style={{ width: '66.6667vw', maxWidth: '100%', flexShrink: 0 }}>
        <div
          ref={chartColRef}
          style={{ boxSizing: 'border-box', border: `1px solid ${isDark ? '#2A2A2A' : '#D9D2C4'}`, padding: 12 }}
        >
          <div ref={leftHeaderRef}>
          {/* View toggle (original position, above the chart) */}
          {distinctSocCodes.length === 2 && measuredWidth >= 700 ? (
            <div style={{ display: 'flex', width: 'fit-content', border: `1px solid ${panelBorder}`, marginBottom: 8 }}>
              {(['comparison', 'differences'] as const).map((mode, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 12,
                    fontFamily: MONO,
                    letterSpacing: '0.08em',
                    background: viewMode === mode ? (isDark ? '#E8E0D0' : '#0D0D0D') : 'transparent',
                    color: viewMode === mode ? (isDark ? '#0D0D0D' : '#E8E0D0') : isDark ? '#9C9680' : '#6B6B5E',
                    border: 'none',
                    borderLeft: i > 0 ? `1px solid ${panelBorder}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'comparison' ? 'COMPARISON' : 'TOP DIFFERENCES'}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, fontFamily: MONO, color: isDark ? '#9C9680' : '#6B6B5E', marginBottom: 8 }}>
              Select two occupations to unlock the TOP DIFFERENCES view.
            </div>
          )}

          {/* Category tabs + note (comparison). Kept rendered in TOP DIFFERENCES
              but hidden, so the chart keeps its position; the reserved space
              carries a one-line description of the ranked view instead. */}
          <div style={{ position: 'relative' }}>
            {showCategoryTabs && (
              <div
                style={{
                  display: 'flex',
                  width: 'fit-content',
                  border: `1px solid ${panelBorder}`,
                  marginBottom: 8,
                  visibility: deltaActive ? 'hidden' : 'visible',
                  pointerEvents: deltaActive ? 'none' : 'auto',
                }}
              >
                {categories.map((cat, i) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '3px 10px',
                      fontSize: 12,
                      fontFamily: MONO,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: effectiveCategory === cat ? (isDark ? '#E8E0D0' : '#0D0D0D') : 'transparent',
                      color: effectiveCategory === cat ? (isDark ? '#0D0D0D' : '#E8E0D0') : isDark ? '#9C9680' : '#6B6B5E',
                      border: 'none',
                      borderLeft: i > 0 ? `1px solid ${panelBorder}` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {lookupCategoryThesis(effectiveCategory) && (
              <div
                style={{
                  marginBottom: 8,
                  fontFamily: MONO,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: isDark ? '#9C9680' : '#6B6B5E',
                  visibility: deltaActive ? 'hidden' : 'visible',
                }}
              >
                {lookupCategoryThesis(effectiveCategory)}
              </div>
            )}

            {deltaActive && (
              <ul
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  margin: 0,
                  paddingLeft: 16,
                  listStyleType: 'disc',
                  fontFamily: MONO,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: isDark ? '#9C9680' : '#6B6B5E',
                }}
              >
                {DIFFERENCES_ABOUT.map((line, i) => (
                  <li key={i} style={{ display: 'list-item', marginBottom: i < DIFFERENCES_ABOUT.length - 1 ? 3 : 0 }}>
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>

          {deltaActive ? (
            <div style={{ maxHeight: deltaScrollH || 400, overflowX: 'hidden', overflowY: 'auto' }}>
              <svg ref={svgRef} role="img" aria-label={title || 'Ability profile chart'} />
            </div>
          ) : (
            <>
              <div style={compScrollH ? { maxHeight: compScrollH, overflowX: 'hidden', overflowY: 'auto' } : undefined}>
                <svg ref={svgRef} role="img" aria-label={title || 'Ability profile chart'} />
              </div>
              {/* Fixed x-axis below the scroll body. */}
              <svg ref={axisSvgRef} role="presentation" aria-hidden="true" />
            </>
          )}
        </div>

        {/* No-ability-data notice — OUTSIDE the box, above the footnotes. Red
            accent (matches Chart 1) so a picked occupation O*NET can't profile
            reads as a data gap, not a broken chart. */}
        {noAbilityData.length > 0 && (
          <div
            style={{
              marginTop: 12,
              borderLeft: '3px solid #8B0000',
              background: isDark ? '#2F2F2F' : '#F5F3F0',
              padding: '6px 10px',
              fontFamily: MONO,
              fontSize: 14,
              lineHeight: 1.5,
              color: isDark ? '#E8E0D0' : '#4A4A4A',
            }}
          >
            {noAbilityData.map((s) => (
              <div key={s.soc} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, background: s.color, flexShrink: 0 }}
                />
                <span>
                  No O*NET ability data for <strong>{s.title}</strong> (SOC {s.soc}), so it isn&apos;t plotted here.
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footnotes — rendered OUTSIDE the bordered chart box, below it. */}
        {deltaActive ? (
          <div
            style={{
              marginTop: 12,
              marginBottom: 36,
              borderLeft: '3px solid #8B7536',
              background: isDark ? '#2F2F2F' : '#F3EFE6',
              padding: '6px 10px',
              fontFamily: MONO,
              fontSize: 14,
              lineHeight: 1.5,
              color: isDark ? '#E8E0D0' : '#4A4A4A',
            }}
          >
            <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
              {DIFFERENCES_FOOTNOTE.map((line, i) => (
                <li key={i} style={{ display: 'list-item', marginBottom: i < DIFFERENCES_FOOTNOTE.length - 1 ? 4 : 0 }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              borderLeft: '3px solid #8B7536',
              background: isDark ? '#2F2F2F' : '#F3EFE6',
              padding: '6px 10px',
              fontFamily: MONO,
              fontSize: 14,
              lineHeight: 1.5,
              color: isDark ? '#E8E0D0' : '#4A4A4A',
            }}
          >
            <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
              <li style={{ display: 'list-item', marginBottom: 4 }}>
                Each dot is an occupation&apos;s rating for that ability. The short vertical tick is the average
                across all occupations in the workforce. Hover a dot for its confidence interval and sample size.
              </li>
              <li style={{ display: 'list-item', marginBottom: 4 }}>
                Ratings use O*NET&apos;s {scaleLabel} scale ({scaleLo}&ndash;{scaleHi}):{' '}
                {scaleIsIM ? 'how important the ability is to the job' : 'how much of the ability the job requires'}.
                The shaded band near {scaleLo} marks abilities the job does not require.
              </li>
              <li style={{ display: 'list-item' }}>
                Tap an ability name to open the glossary and see what the term means.
              </li>
            </ul>
          </div>
        )}
        </div>

        {/* ===== RIGHT: glossary (top-right) + legend + context (aligned to chart body) ===== */}
        {/* flex:1 fills the space to the right of the 66.6667vw chart (relative,
            no fixed width), starting at the chart's edge so it never overlaps. */}
        <div style={{ flex: 1, minWidth: 0, fontFamily: MONO, position: 'relative', zIndex: 1 }}>
          {/* Glossary button — floating, fixed to the bottom-right of the
              viewport so it stays reachable however far you scroll. Sits below
              the drawer's own z-index (1001) so the backdrop covers it when the
              drawer is open. */}
          <button
            onClick={() => openGlossary()}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 900,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: MONO,
              letterSpacing: '0.08em',
              background: isDark ? '#181818' : '#FFFFFF',
              color: isDark ? '#E8E0D0' : '#0D0D0D',
              border: `1px solid ${panelBorder}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `1px solid ${panelBorder}`,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              ?
            </span>
            GLOSSARY
          </button>

          {/* Legend + context, lowered so the legend starts level with the chart body */}
          <div style={{ paddingTop: leftHeaderH }}>
            {/* Legend */}
            {deltaActive ? (
              (() => {
                const refName = (resolvedRefBody && (occupationTitles?.[resolvedRefBody] ?? resolvedRefBody)) || '—'
                const compName = (resolvedCompBody && (occupationTitles?.[resolvedCompBody] ?? resolvedCompBody)) || '—'
                const refColor = (resolvedRefBody && occColors[resolvedRefBody]) || (isDark ? '#9C9680' : '#6B6B5E')
                const compColor = (resolvedCompBody && occColors[resolvedCompBody]) || (isDark ? '#9C9680' : '#6B6B5E')
                const label = isDark ? '#9C9680' : '#4A4A4A'
                const dot = (c: string) => (
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, background: c, marginRight: 5, verticalAlign: 'middle' }} />
                )
                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      width: 'fit-content',
                      maxWidth: '100%',
                      marginBottom: 10,
                      padding: '8px 10px',
                      border: `1px solid ${panelBorder}`,
                      background: isDark ? '#0D0D0D' : '#FFFFFF',
                      fontSize: 14,
                      color: label,
                    }}
                  >
                    <span>{dot(compColor)}← {compName} higher</span>
                    <span>{dot(refColor)}{refName} higher →</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 12, height: 9, background: label }} />
                      difference is clear
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 12, height: 9, border: `1px solid ${label}` }} />
                      may be noise (~)
                    </span>
                    <span>ranked by gap size · all abilities</span>
                  </div>
                )
              })()
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  width: 'fit-content',
                  maxWidth: '100%',
                  marginBottom: 10,
                  padding: '6px 10px',
                  border: `1px solid ${panelBorder}`,
                  background: isDark ? '#0D0D0D' : '#FFFFFF',
                  fontSize: 14,
                  color: isDark ? '#9C9680' : '#6B6B5E',
                }}
              >
                {distinctSocCodes.map((soc) => (
                  <span key={soc} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 8,
                        background: occColors[soc] ?? (isDark ? '#9C9680' : '#6B6B5E'),
                      }}
                    />
                    {occupationTitles?.[soc] ?? soc}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 1, height: 11, background: isDark ? '#6B6B5E' : '#9C9680' }} />
                  Workforce Average
                </span>
              </div>
            )}

            {/* Framing question (heading) + thesis narrative (body) in one block */}
            <div
              style={{
                marginBottom: 10,
                borderLeft: '3px solid #4A4A4A',
                background: isDark ? '#181818' : '#F5F3F0',
                padding: '6px 10px',
                fontSize: 14,
                lineHeight: 1.5,
                color: isDark ? '#9C9680' : '#4A4A4A',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: isDark ? '#E8E0D0' : '#0D0D0D' }}>
                {deltaActive ? VIEW_FRAMING.differences : VIEW_FRAMING.comparison}
              </div>
              {CHART_THESIS_INTRO}
            </div>
          </div>
        </div>
      </div>
      {tip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tip.left,
            top: tip.top,
            maxWidth: 260,
            pointerEvents: 'none',
            background: isDark ? '#0D0D0D' : '#FFFFFF',
            border: `1px solid ${isDark ? '#4A4A4A' : '#9C9680'}`,
            padding: '6px 8px',
            fontFamily: MONO,
            fontSize: 14,
            color: isDark ? '#E8E0D0' : '#0D0D0D',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{tip.title}</div>
          {tip.lines.map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 4 }} />
            ) : (
              <div key={i} style={{ marginBottom: i < tip.lines.length - 1 ? 2 : 0 }}>
                {line}
              </div>
            )
          )}
        </div>
      )}
      {glossaryOpen && (
        <>
          {/* Backdrop + drawer start below the sticky site header (Tailwind h-16
              = 64px) so the header stays visible and usable while open. */}
          <div
            onClick={() => setGlossaryOpen(false)}
            style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
          />
          {/* Slide-in drawer */}
          <div
            style={{
              position: 'fixed',
              top: 64,
              right: 0,
              height: 'calc(100vh - 64px)',
              width: 'min(380px, 92vw)',
              background: isDark ? '#0D0D0D' : '#FFFFFF',
              borderLeft: `1px solid ${isDark ? '#4A4A4A' : '#9C9680'}`,
              boxShadow: '0 0 24px rgba(0,0,0,0.25)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: MONO,
              color: isDark ? '#E8E0D0' : '#0D0D0D',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: `1px solid ${isDark ? '#4A4A4A' : '#9C9680'}`,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.08em' }}>GLOSSARY</span>
              <button
                onClick={() => setGlossaryOpen(false)}
                aria-label="Close glossary"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  color: isDark ? '#9C9680' : '#6B6B5E',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${isDark ? '#2A2A2A' : '#E0DEDB'}` }}>
              <input
                autoFocus
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                placeholder="Search terms…"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '6px 8px',
                  fontFamily: MONO,
                  fontSize: 14,
                  background: isDark ? '#181818' : '#F5F3F0',
                  color: isDark ? '#E8E0D0' : '#0D0D0D',
                  border: `1px solid ${isDark ? '#4A4A4A' : '#9C9680'}`,
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 14px 20px' }}>
              {(() => {
                const q = glossaryQuery.trim().toLowerCase()
                const filtered = GLOSSARY_ENTRIES.filter(
                  (e) => !q || e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q)
                )
                if (filtered.length === 0) {
                  return <div style={{ fontSize: 14, color: isDark ? '#9C9680' : '#6B6B5E' }}>No matching terms.</div>
                }
                return filtered.map((e) => (
                  <div key={`${e.category}-${e.term}`} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {e.term}
                      <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 12, color: isDark ? '#6B6B5E' : '#9C9680', letterSpacing: '0.06em' }}>
                        {e.category.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: isDark ? '#9C9680' : '#4A4A4A' }}>
                      {e.definition}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
