'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useTheme } from 'next-themes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface EmploymentDataPoint {
  year: number
  employment: number | null
  employment_index: number | null
  is_projected: boolean
  is_suppressed: boolean
}
export interface EmploymentSeries {
  soc_code: string
  title: string
  data: EmploymentDataPoint[]
}
export interface EmploymentMilestone {
  year: number
  month: number | null
  label: string
  description: string
}
export interface EmploymentChartData {
  series: EmploymentSeries[]
  milestones: EmploymentMilestone[]
  warnings?: string[]
}
export interface EmploymentChartProps {
  data: EmploymentChartData
  width?: number
  height?: number
  // Optional per-occupation subtitle (e.g. tier description), keyed by soc_code.
  // Kept as a prop — NOT hardcoded — so the component stays occupation-agnostic.
  subtitles?: Record<string, string>
  // Optional explicit per-occupation line colors, keyed by soc_code. When given,
  // overrides the internal palette so colors stay positional / consistent with
  // the caller (e.g. Job 1 black, Job 2 red). Tolerant to the ".00" suffix.
  occupationColors?: Record<string, string>
  // Dark-mode counterpart of occupationColors. Job 1 is near-black in light mode
  // and would vanish on the dark background, so callers pass a light-on-dark
  // palette here; the chart picks this map when the theme is dark.
  occupationColorsDark?: Record<string, string>
  // Opt-in: scale margins/fonts/dots to container width (see REFERENCE_WIDTH).
  // Defaults to off so existing callers keep today's fixed-pixel layout.
  responsiveScale?: boolean
}

// Line palette. Red (#8B0000) is reserved as the visual anchor for Computer
// Programmers (15-1251); every other series draws from index 1 onward. Index 1
// is black (#0D0D0D) so Software Developers matches its color in the /onet
// ProfileChart.
const COLORS = ['#8B0000', '#0D0D0D', '#8B7536', '#2F2F2F', '#6B6B5E']
// Inherit the site font (Inter) instead of hardcoding a family. Name kept.
const MONO = 'inherit'

const X_MIN = 2018
const X_MAX = 2026
const PROJECTED_X = 2024.5
const Y_FLOOR = 30 // never go below
const Y_CEIL = 150 // never exceed

// Responsive scaling: pixel constants below were tuned at this width. Narrower
// containers scale margins/fonts/dots down (clamped) so a compact layout
// doesn't just crop the same fixed-size chrome.
const REFERENCE_WIDTH = 800
const MIN_SCALE = 0.9
const MAX_SCALE = 1.15
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface TooltipState {
  visible: boolean
  left: number
  top: number
  title: string
  note?: string
  rows: { title: string; color: string; indexText: string; empText: string }[]
}

const inRange = (y: number) => y >= X_MIN && y <= X_MAX
const milestoneX = (m: EmploymentMilestone) => m.year + (m.month != null ? m.month : 6) / 12

// Cap on wrapped title lines for the end-of-line label. The full title always
// appears in the legend, so an over-long name is truncated with an ellipsis here
// rather than stacking 5-6 lines and colliding with the other series' label.
const MAX_TITLE_LINES = 2

// Truncate a wrapped line list to maxLines, marking the last kept line with an
// ellipsis so it reads as "continued in the legend" rather than a hard cut.
function capLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = kept[maxLines - 1].replace(/[.,\s]+$/, '') + '…'
  return kept
}

// Word-wraps text to fit maxWidth without breaking words, using the ~0.6em
// average advance width of the MONO font stack to estimate line length.
function wrapMonoText(text: string, fontSizePx: number, maxWidth: number): string[] {
  const maxChars = Math.max(1, Math.floor(maxWidth / (fontSizePx * 0.6)))
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

// Colors per series. If an explicit occupationColors map is given, use it
// (tolerant to the ".00" suffix) so colors stay positional/consistent with the
// caller. Otherwise fall back to the internal palette (red anchored to 15-1251).
function resolveSeriesColors(series: EmploymentSeries[], occ?: Record<string, string>): string[] {
  const base = (s: string) => s.split('.')[0]
  let ptr = 1
  return series.map((s) => {
    if (occ) {
      if (occ[s.soc_code]) return occ[s.soc_code]
      const hit = Object.keys(occ).find((k) => base(k) === base(s.soc_code))
      if (hit) return occ[hit]
    }
    return s.soc_code.includes('15-1251') ? COLORS[0] : COLORS[ptr++ % COLORS.length]
  })
}

export default function EmploymentChart({
  data,
  width: widthProp,
  height = 702,
  subtitles,
  occupationColors,
  occupationColorsDark,
  responsiveScale = false,
}: EmploymentChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const plotRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number>(widthProp ?? 900)
  const [tip, setTip] = useState<TooltipState>({ visible: false, left: 0, top: 0, title: '', rows: [] })

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  // Theme-correct occupation palette: dark map when dark (so Job 1 doesn't
  // disappear on the dark background), light map otherwise.
  const activeOccColors = (isDark && occupationColorsDark) || occupationColors

  // Picked occupations that return NO in-range employment points. Their line is
  // simply absent from the plot, which reads as a render bug rather than a data
  // gap — so we call it out explicitly below the chart (responsive callers only,
  // to keep the /onet/test reference layout byte-identical). Colors resolved the
  // same way the draw effect does, so the swatch matches the (missing) line.
  // Memoised so it doesn't recompute on every tooltip-driven re-render.
  const noDataSeries = useMemo(() => {
    const colors = resolveSeriesColors(data.series, activeOccColors)
    return data.series
      .map((s, i) => ({ soc: s.soc_code, title: s.title, color: colors[i] }))
      .filter((_, i) => !data.series[i].data.some((d) => inRange(d.year) && d.employment_index !== null))
  }, [data, activeOccColors])

  // ----- Responsive width via ResizeObserver -----
  useEffect(() => {
    if (widthProp) {
      setMeasuredWidth(widthProp)
      return
    }
    // Measure the plot wrapper (which carries the border/padding) so the SVG
    // sizes to the space inside the frame, not the outer container.
    const el = plotRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setMeasuredWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect() // cleanup to avoid leaks on unmount
  }, [widthProp])

  // ----- Draw -----
  useEffect(() => {
    const width = measuredWidth
    if (!svgRef.current || width <= 0) return

    // The SVG sits inside the bordered+padded plot wrapper (responsive only), so
    // its internal coords are offset from the tooltip's container by border(1)
    // + padding(12). Add this to tooltip positions so they align with the point.
    const framePad = responsiveScale ? 13 : 0

    const fg = isDark ? '#E8E0D0' : '#0D0D0D'
    const muted = isDark ? '#9C9680' : '#6B6B5E'
    const axisColor = isDark ? '#4A4A4A' : '#9C9680'
    const bg = isDark ? '#0D0D0D' : '#FFFFFF'

    const scale = responsiveScale ? clamp(width / REFERENCE_WIDTH, MIN_SCALE, MAX_SCALE) : 1
    const px = (base: number, min: number) => Math.max(min, Math.round(base * scale * 10) / 10)

    const margin = { top: px(52, 40), right: px(160, 110), bottom: px(138, 110), left: px(64, 60) }
    const innerW = Math.max(10, width - margin.left - margin.right)
    const innerH = Math.max(10, height - margin.top - margin.bottom)

    const seriesColors = resolveSeriesColors(data.series, activeOccColors)
    // null is the ONLY break condition. Suppressed rows already carry a
    // null employment_index, so they break too — without dropping valid points.
    const defined = (d: EmploymentDataPoint) => d.employment_index !== null

    // Last year each series actually has data. Used by the crosshair to stop
    // reporting "No data" once you hover past a series' real coverage (e.g. the
    // 2025-2026 projected zone), which was pure noise. null = no data at all.
    const seriesLastYear = data.series.map((s) => {
      const defs = s.data.filter((d) => inRange(d.year) && defined(d))
      return defs.length ? Math.max(...defs.map((d) => d.year)) : null
    })

    // Dynamic Y domain that fits the actual data (any occupation can exceed the
    // old 30–150 clamp — e.g. HR Specialists run 28–155). Always include the
    // 100 baseline, floor at 0, 10% padding, no hard ceiling.
    const allVals = data.series.flatMap((s) =>
      s.data.filter((d) => inRange(d.year) && defined(d)).map((d) => d.employment_index as number)
    )
    let yLo = 90
    let yHi = 110
    if (allVals.length) {
      const dmin = Math.min(...allVals, 100) // include baseline so it stays visible
      const dmax = Math.max(...allVals, 100)
      const pad = (dmax - dmin) * 0.1 || 10
      yLo = Math.max(0, dmin - pad)
      yHi = dmax + pad
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height).style('background', bg)

    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([X_MIN, X_MAX]).range([0, innerW])
    const y = d3.scaleLinear().domain([yLo, yHi]).range([innerH, 0])

    // ----- y=100 baseline (only if within the visible domain) -----
    if (yLo <= 100 && 100 <= yHi) {
      root
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', y(100))
        .attr('y2', y(100))
        .attr('stroke', muted)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.7)
    }

    // ----- Axes -----
    const xAxis = d3.axisBottom(x).tickValues(d3.range(X_MIN, X_MAX + 1)).tickFormat(d3.format('d')).tickSize(6)
    const xg = root.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
    xg.selectAll('text').attr('font-family', MONO).attr('font-size', px(14, 13)).attr('fill', fg)
    xg.selectAll('line').attr('stroke', axisColor)
    xg.select('.domain').attr('stroke', axisColor)

    const yAxis = d3.axisLeft(y).ticks(7).tickFormat(d3.format('d')).tickSize(6)
    const yg = root.append('g').call(yAxis)
    yg.selectAll('text').attr('font-family', MONO).attr('font-size', px(14, 13)).attr('fill', fg)
    yg.selectAll('line').attr('stroke', axisColor)
    yg.select('.domain').attr('stroke', axisColor)

    // ----- Axis titles -----
    root
      .append('text')
      .attr('transform', `translate(${-42},${innerH / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('font-family', MONO)
      .attr('font-size', px(14, 13))
      .attr('fill', muted)
      .text('Employment Index (2018 = 100)')
    // "Year" axis title sits BELOW the milestone tier (drawn later at YEAR_ROW +
    // stagger), so it clears both the year numbers and the milestone labels.
    root
      .append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + px(38, 31))
      .attr('text-anchor', 'middle')
      .attr('font-family', MONO)
      .attr('font-size', px(14, 13))
      .attr('fill', muted)
      .text('Year')

    // ----- Projected zone divider -----
    root
      .append('line')
      .attr('x1', x(PROJECTED_X))
      .attr('x2', x(PROJECTED_X))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', muted)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,3')
    root
      .append('text')
      .attr('x', x(PROJECTED_X) + 6)
      .attr('y', -14)
      .attr('font-family', MONO)
      .attr('font-size', px(12, 11))
      .attr('letter-spacing', '0.15em')
      .attr('fill', muted)
      .text('PROJECTED')
    root
      .append('text')
      .attr('x', x((X_MIN + PROJECTED_X) / 2))
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('font-family', MONO)
      .attr('font-size', px(12, 11))
      .attr('letter-spacing', '0.15em')
      .attr('fill', muted)
      .text('BLS DATA 2018-2024')

    // ----- Lines -----
    const lineGen = d3
      .line<EmploymentDataPoint>()
      .defined(defined)
      .curve(d3.curveMonotoneX) // smoother lines, no overshoot
      .x((d) => x(d.year))
      .y((d) => y(d.employment_index as number))

    // End-of-line label specs collected during the series loop. For the
    // responsive layout they are drawn AFTER the loop so overlapping blocks can
    // be pushed apart (collision avoidance); non-responsive draws inline as before.
    type EndLabel = {
      tx: number
      ty: number
      rows: { text: string; fontSize: number; bold?: boolean; fill: string }[]
      offsets: number[]
      lastOffset: number
      growUp: boolean
      blockShift: number
    }
    const endLabels: EndLabel[] = []

    data.series.forEach((s, i) => {
      const color = seriesColors[i]
      const visible = s.data.filter((d) => inRange(d.year))
      const actual = visible.filter((d) => !d.is_projected)
      let projected = visible.filter((d) => d.is_projected)
      if (projected.length && actual.length) {
        const lastActual = actual[actual.length - 1]
        if (defined(lastActual)) projected = [lastActual, ...projected]
      }

      if (actual.length) {
        root.append('path').datum(actual).attr('fill', 'none').attr('stroke', color).attr('stroke-width', px(2, 1.3)).attr('d', lineGen)
      }
      if (projected.length) {
        root
          .append('path')
          .datum(projected)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', px(1.5, 1))
          .attr('stroke-dasharray', '4,4')
          .attr('d', lineGen)
      }

      // Faint dotted bridge across internal gaps (a run of nulls between
      // two defined points) — signals the gap is intentional, not a render bug,
      // without implying real data exists. Generic for any series with a gap.
      for (let gi = 0; gi < visible.length - 1; gi++) {
        if (!defined(visible[gi])) continue
        let gj = gi + 1
        while (gj < visible.length && !defined(visible[gj])) gj++
        if (gj < visible.length && gj > gi + 1 && defined(visible[gj])) {
          const a = visible[gi]
          const b = visible[gj]
          root
            .append('line')
            .attr('x1', x(a.year))
            .attr('y1', y(a.employment_index as number))
            .attr('x2', x(b.year))
            .attr('y2', y(b.employment_index as number))
            .attr('stroke', color)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,4')
            .attr('opacity', 0.4)
        }
        gi = gj - 1
      }

      // Any defined point bordering a gap (or fully isolated) gets a dot
      // so it stays visible — e.g. 15-1252's 2018 point (=100) on the edge of the
      // 2019-2020 gap, and the 2021 resume point. A connecting line needs two
      // adjacent defined points, so a gap-edge point would otherwise vanish.
      visible.forEach((d, idx) => {
        if (!defined(d)) return
        const prevMissing = idx > 0 && !defined(visible[idx - 1])
        const nextMissing = idx < visible.length - 1 && !defined(visible[idx + 1])
        if (prevMissing || nextMissing) {
          root
            .append('circle')
            .attr('cx', x(d.year))
            .attr('cy', y(d.employment_index as number))
            .attr('r', px(5, 3.5))
            .attr('fill', color)
        }
      })

      // Index value dot + label at 2024.
      const at2024 = visible.find((d) => d.year === 2024 && defined(d))
      if (at2024 && at2024.employment_index !== null) {
        root.append('circle').attr('cx', x(2024)).attr('cy', y(at2024.employment_index)).attr('r', px(5, 3.5)).attr('fill', color)
        root
          .append('text')
          .attr('x', x(2024) - 8)
          .attr('y', y(at2024.employment_index) - 8)
          .attr('text-anchor', 'end')
          .attr('font-family', MONO)
          .attr('font-size', px(14, 13))
          .attr('fill', fg)
          .text(Math.round(at2024.employment_index))
      }

      // Title (+ optional subtitle) at the rightmost defined point. Subtitle
      // wraps by word (never mid-word) to fit the available margin.right
      // space. Reading order is always title-then-subtitle; what flips for
      // points in the lower half of the plot (near the x-axis) is which edge
      // of that block anchors next to the point — the block grows away from
      // the axis instead of into it, but title stays first.
      const lastDefined = [...visible].reverse().find(defined)
      if (lastDefined && lastDefined.employment_index !== null) {
        const tx = x(lastDefined.year) + 10
        const ty = y(lastDefined.employment_index)
        const sub = subtitles?.[s.soc_code]
        const titleFontSize = px(14, 13)
        const subFontSize = px(12, 11)
        // Sized off margin.right (the reserved label column), not off the
        // distance from tx to the SVG edge — the last data point isn't
        // necessarily at the domain max, so that distance can hugely
        // overstate how much room the label column actually has.
        const maxTextWidth = Math.max(40, margin.right - 18)
        // Wrapping/direction-aware stacking is opt-in (see responsiveScale doc
        // comment) — non-responsive callers keep the original single-line subtitle.
        // Wrap the TITLE too (responsive only): long occupation names (e.g.
        // "First-Line Supervisors of Construction Trades and Extraction Workers")
        // would otherwise run a single line past the label column and get clipped
        // by the frame's overflow:hidden. Non-responsive keeps the single line.
        const titleLines = responsiveScale
          ? capLines(wrapMonoText(s.title, titleFontSize, maxTextWidth), MAX_TITLE_LINES)
          : [s.title]
        const subLines = sub ? (responsiveScale ? wrapMonoText(sub, subFontSize, maxTextWidth) : [sub]) : []
        const titleLineHeight = titleFontSize * 1.2
        const lineHeight = subFontSize * 1.2
        const titleSubGap = 14 // matches the original ty-6 / ty+8 spacing exactly
        const growUp = responsiveScale && ty >= innerH / 2
        const blockShift = subLines.length ? 6 : 0

        const nTitle = titleLines.length
        const rows: { text: string; fontSize: number; bold?: boolean; fill: string }[] = [
          ...titleLines.map((t) => ({ text: t, fontSize: titleFontSize, bold: true, fill: color })),
          ...subLines.map((line) => ({ text: line, fontSize: subFontSize, fill: muted })),
        ]
        // Row-to-row vertical step: title-to-title uses the title line height,
        // the last title line to the first subtitle uses the fixed gap, and
        // subtitle-to-subtitle uses the subtitle line height.
        const offsets = [0]
        for (let i = 1; i < rows.length; i++) {
          const step = i < nTitle ? titleLineHeight : i === nTitle ? titleSubGap : lineHeight
          offsets.push(offsets[i - 1] + step)
        }
        const lastOffset = offsets[offsets.length - 1]

        // Responsive: defer drawing so overlapping label blocks can be resolved
        // after all series are known. Non-responsive: draw inline (unchanged).
        if (responsiveScale) {
          endLabels.push({ tx, ty, rows, offsets, lastOffset, growUp, blockShift })
        } else {
          rows.forEach((row, i) => {
            const rowY = growUp ? ty + blockShift - (lastOffset - offsets[i]) : ty - blockShift + offsets[i]
            const el = root
              .append('text')
              .attr('x', tx)
              .attr('y', rowY)
              .attr('font-family', MONO)
              .attr('font-size', row.fontSize)
              .attr('fill', row.fill)
              .text(row.text)
            if (row.bold) el.attr('font-weight', 700)
          })
        }
      }
    })

    // ----- Resolve + draw end-of-line labels (responsive only) -----
    // Each block occupies [top, bottom]; walking top-to-bottom, any block that
    // would overlap the one above is nudged straight down by the overlap plus a
    // small gap, so two nearby trailing labels never sit on top of each other.
    if (endLabels.length) {
      const LABEL_GAP = px(6, 5)
      const blockTop = (l: EndLabel) => (l.growUp ? l.ty + l.blockShift - l.lastOffset : l.ty - l.blockShift)
      const withShift = endLabels
        .map((l) => ({ l, shift: 0 }))
        .sort((a, b) => blockTop(a.l) - blockTop(b.l))
      for (let i = 1; i < withShift.length; i++) {
        const prev = withShift[i - 1]
        const cur = withShift[i]
        const prevBottom = blockTop(prev.l) + prev.shift + prev.l.lastOffset
        const curTop = blockTop(cur.l) + cur.shift
        if (curTop < prevBottom + LABEL_GAP) cur.shift = prevBottom + LABEL_GAP - blockTop(cur.l)
      }
      for (const { l, shift } of withShift) {
        l.rows.forEach((row, i) => {
          const baseY = l.growUp ? l.ty + l.blockShift - (l.lastOffset - l.offsets[i]) : l.ty - l.blockShift + l.offsets[i]
          const el = root
            .append('text')
            .attr('x', l.tx)
            .attr('y', baseY + shift)
            .attr('font-family', MONO)
            .attr('font-size', row.fontSize)
            .attr('fill', row.fill)
            .text(row.text)
          if (row.bold) el.attr('font-weight', 700)
        })
      }
    }

    // ----- Milestones (stagger close labels) -----
    const milestones = data.milestones
      .filter((m) => inRange(milestoneX(m)))
      .slice()
      .sort((a, b) => x(milestoneX(a)) - x(milestoneX(b)))
    const mg = root.append('g')
    let prevPx = -Infinity
    let level = 0
    // Vertical room reserved for the axis year numbers; milestone labels sit
    // BELOW this row (Option A) so AI milestones read as a separate tier.
    const YEAR_ROW = px(44, 36)
    milestones.forEach((m) => {
      // The baseline milestone belongs exactly on the X_MIN tick, not the
      // month-based half-year offset milestoneX() gives every other entry —
      // otherwise it visibly drifts right of "2018". It gets a plain centered
      // label straight below instead of joining the diagonal stagger. Opt-in
      // (see responsiveScale doc comment); non-responsive keeps the old layout.
      const isAtAxisStart = responsiveScale && m.year === X_MIN
      const mx = isAtAxisStart ? x(X_MIN) : x(milestoneX(m)) // exact scaled x = xScale(year + month/12)
      if (!isAtAxisStart) {
        // Comb-stagger when labels are within 30px.
        if (mx - prevPx < 30) level = (level + 1) % 3
        else level = 0
      }
      prevPx = mx

      // Option A: drop each milestone label below the year-number row and draw a
      // connector line from the axis down to it, so AI markers form a distinct
      // tier and don't collide with the year labels. (Non-responsive callers
      // keep the original short-tick layout just under the axis.)
      let labelY: number
      let lineEndY: number
      if (isAtAxisStart) {
        labelY = innerH + YEAR_ROW + px(10, 8)
        lineEndY = innerH + 6
      } else if (responsiveScale) {
        labelY = innerH + YEAR_ROW + px(12, 10) + level * px(20, 15)
        lineEndY = labelY - 4
      } else {
        labelY = innerH + px(10, 6) + level * px(25, 16)
        lineEndY = innerH + 6
      }
      const isConnector = responsiveScale && !isAtAxisStart

      mg.append('line')
        .attr('x1', mx)
        .attr('x2', mx)
        .attr('y1', innerH + 2)
        .attr('y2', lineEndY)
        .attr('stroke', isConnector ? axisColor : muted)
        .attr('stroke-width', 1)
        .attr('opacity', isConnector ? 0.5 : 1)

      const label = isAtAxisStart
        ? mg
            .append('text')
            .attr('x', mx)
            .attr('y', labelY)
            .attr('text-anchor', 'middle')
            .attr('font-family', MONO)
            .attr('font-size', px(12, 11))
            .attr('fill', muted)
            .style('cursor', 'default')
            .text(m.label)
        : mg
            .append('text')
            .attr('x', mx)
            .attr('y', labelY)
            .attr('transform', `rotate(-45 ${mx} ${labelY})`)
            .attr('text-anchor', 'end')
            .attr('font-family', MONO)
            .attr('font-size', px(12, 11))
            .attr('fill', muted)
            .style('cursor', 'default')
            .text(m.label)
      label
        .on('mouseenter', () => {
          setTip({
            visible: true,
            left: framePad + margin.left + mx + 8,
            top: framePad + margin.top + innerH + 24,
            title: `${m.label} (${m.year}${m.month != null ? '-' + String(m.month).padStart(2, '0') : ''})`,
            note: m.description,
            rows: [],
          })
        })
        .on('mouseleave', () => setTip((t) => ({ ...t, visible: false })))
    })

    // ----- Hover crosshair + tooltip -----
    const crosshair = root
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', muted)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0)

    root
      .append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event)
        let yr = Math.round(x.invert(mx))
        if (yr < X_MIN) yr = X_MIN
        if (yr > X_MAX) yr = X_MAX
        crosshair.attr('x1', x(yr)).attr('x2', x(yr)).style('opacity', 1)
        const rows = data.series.flatMap((s, i) => {
          const pt = s.data.find((d) => d.year === yr)
          const hasVal = pt != null && pt.employment_index !== null
          const lastYr = seriesLastYear[i]
          // Drop the row when there's no value AND we're outside this series'
          // real coverage (no data at all, or past its last year) — so the empty
          // projected zone stops reporting "No data" for every occupation. An
          // internal gap (null but before the last real year) still shows it, to
          // signal the gap is intentional rather than a render bug.
          if (!hasVal && (lastYr === null || yr > lastYr)) return []
          return [
            {
              title: s.title,
              color: seriesColors[i],
              indexText: hasVal ? String(Math.round(pt!.employment_index as number)) : 'No data',
              empText: pt && pt.employment != null ? (pt.employment as number).toLocaleString() : '—',
            },
          ]
        })
        // Nothing to report for this year: keep the crosshair (position feedback)
        // but hide the tooltip rather than showing an empty/"No data"-only box.
        if (rows.length === 0) {
          setTip((t) => ({ ...t, visible: false }))
          return
        }
        const left = framePad + margin.left + x(yr) + 12
        setTip({
          visible: true,
          left: left + 220 > width ? framePad + margin.left + x(yr) - 232 : left,
          top: framePad + margin.top + 8,
          title: String(yr),
          rows,
        })
      })
      .on('mouseleave', () => {
        crosshair.style('opacity', 0)
        setTip((t) => ({ ...t, visible: false }))
      })
  }, [data, measuredWidth, height, isDark, subtitles, occupationColors, occupationColorsDark, responsiveScale])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Plot wrapper carries the frame border (responsive only); the warning /
          hint footnotes below sit OUTSIDE this box. */}
      <div
        ref={plotRef}
        style={
          responsiveScale
            ? { boxSizing: 'border-box', border: `1px solid ${isDark ? '#2A2A2A' : '#D9D2C4'}`, padding: 12, overflow: 'hidden' }
            : undefined
        }
      >
        <svg
          ref={svgRef}
          role="img"
          aria-label="Employment index chart showing occupational employment trends over time"
          style={{ display: 'block' }}
        />
      </div>
      {tip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tip.left,
            top: tip.top,
            maxWidth: 240,
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
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tip.title}</div>
          {tip.note && <div style={{ marginBottom: 2 }}>{tip.note}</div>}
          {tip.rows.map((r, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ color: r.color, fontWeight: 700 }}>{r.title}</div>
              <div style={{ paddingLeft: 10 }}>Index: {r.indexText}</div>
              <div style={{ paddingLeft: 10 }}>Employment: {r.empText}</div>
            </div>
          ))}
        </div>
      )}
      {responsiveScale && noDataSeries.length > 0 && (
        <div
          style={{
            marginTop: 12,
            borderLeft: '3px solid #8B0000',
            background: isDark ? '#2F2F2F' : '#F5F3F0',
            padding: '6px 10px',
            fontFamily: MONO,
            fontSize: 14,
            color: isDark ? '#E8E0D0' : '#4A4A4A',
          }}
        >
          {noDataSeries.map((s) => (
            <div key={s.soc} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, background: s.color, flexShrink: 0 }}
              />
              <span>
                No BLS employment data for <strong>{s.title}</strong> (SOC {s.soc}), so its line isn&apos;t shown. Chart 2
                still compares its abilities.
              </span>
            </div>
          ))}
        </div>
      )}
      {responsiveScale && (
        <div
          style={{
            marginTop: 12,
            borderLeft: '3px solid #8B7536',
            background: isDark ? '#2F2F2F' : '#F3EFE6',
            padding: '6px 10px',
            fontFamily: MONO,
            fontSize: 14,
            color: isDark ? '#E8E0D0' : '#4A4A4A',
          }}
        >
          Hover anywhere on the chart to see the exact index value and employment count for that year. Hover a
          milestone label below the axis for the date and description of that AI development milestone.
        </div>
      )}
      {data.warnings && data.warnings.length > 0 && (
        <div
          style={{
            marginTop: 8,
            borderLeft: '3px solid #8B7536',
            background: isDark ? '#2F2F2F' : '#F3EFE6',
            padding: '6px 10px',
            fontFamily: MONO,
            fontSize: 14,
            color: isDark ? '#E8E0D0' : '#4A4A4A',
          }}
        >
          {data.warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
    </div>
  )
}
