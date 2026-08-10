'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

// Search-result shape from /api/onet/search (subset we use).
interface OccResult {
  soc_code: string
  title: string
}
export interface OccSlot {
  soc: string
  title: string
}
// Row shape from /api/onet/occupations (used by the browse-all drawer).
interface AllOcc {
  soc_code: string
  title: string
  major_group_name: string | null
}

const FONT = 'inherit'
// Chrome colors use the site's shadcn vars so the picker flips with the theme;
// the brass accent works on both light and dark, so it stays a literal.
const BORDER = 'hsl(var(--input))'
const ACCENT = '#8B7536' // brass — draws attention to the picker as the primary control
const JOB_COLORS = ['#0D0D0D', '#8B0000'] // Job 1 black, Job 2 red (positional, light)
const JOB_COLORS_DARK = ['#E8E0D0', '#E06666'] // light-on-dark counterparts (see page.tsx)

// Shown when a slot is focused but empty, so the user has a starting point.
// All are verified to have BLS employment data (so they actually render).
const SUGGESTIONS: OccResult[] = [
  { soc_code: '15-1252.00', title: 'Software Developers' },
  { soc_code: '15-1251.00', title: 'Computer Programmers' },
  { soc_code: '29-1141.00', title: 'Registered Nurses' },
  { soc_code: '13-2011.00', title: 'Accountants and Auditors' },
  { soc_code: '25-2021.00', title: 'Elementary School Teachers' },
  { soc_code: '47-2031.00', title: 'Carpenters' },
  { soc_code: '43-4051.00', title: 'Customer Service Representatives' },
  { soc_code: '41-2031.00', title: 'Retail Salespersons' },
  { soc_code: '27-1024.00', title: 'Graphic Designers' },
  { soc_code: '53-3032.00', title: 'Heavy and Tractor-Trailer Truck Drivers' },
]

/**
 * Two-slot occupation picker. The URL (?soc=A,B) is the single source of truth:
 * the currently-selected pair comes in via `initial` (resolved server-side),
 * and picking a new occupation navigates to a new ?soc — which re-renders the
 * page with fresh data and a fresh `initial`. No internal selection state.
 */
export default function OccupationPicker({ initial }: { initial: OccSlot[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const jobColors = resolvedTheme === 'dark' ? JOB_COLORS_DARK : JOB_COLORS

  // "Browse all occupations" drawer state. The full list (~1,000 rows) is
  // fetched once, the first time the drawer opens, then filtered client-side.
  const [browseOpen, setBrowseOpen] = useState(false)
  const [allOccs, setAllOccs] = useState<AllOcc[]>([])
  const [occsLoading, setOccsLoading] = useState(false)
  const [occsError, setOccsError] = useState(false)
  const [browseQuery, setBrowseQuery] = useState('')

  useEffect(() => {
    if (!browseOpen || allOccs.length || occsLoading) return
    setOccsLoading(true)
    setOccsError(false)
    fetch('/api/onet/occupations')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((rows) => setAllOccs(Array.isArray(rows) ? rows : []))
      .catch(() => setOccsError(true))
      .finally(() => setOccsLoading(false))
  }, [browseOpen, allOccs.length, occsLoading])

  const selectSlot = (index: number, sel: OccSlot) => {
    const a = index === 0 ? sel.soc : (initial[0]?.soc ?? '')
    const b = index === 1 ? sel.soc : (initial[1]?.soc ?? '')
    const socs = [a, b].filter(Boolean)
    if (socs.length) router.push(`${pathname}?soc=${encodeURIComponent(socs.join(','))}`)
  }

  return (
    <div style={{ width: 360, maxWidth: '100%' }}>
    <div
      style={{
        // Thicker, darker border so the eye lands here first: this is where
        // you drive both charts.
        border: `2px solid ${ACCENT}`,
        padding: '12px 14px',
        fontFamily: FONT,
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'hsl(var(--foreground))',
          marginBottom: 2,
        }}
      >
        Select two occupations to compare
      </div>
      {[0, 1].map((i) => (
        <SlotRow
          key={i}
          label={`Occupation ${i + 1}`}
          chip={jobColors[i]}
          value={initial[i] ?? { soc: '', title: '' }}
          otherSoc={initial[1 - i]?.soc ?? ''}
          onSelect={(sel) => selectSlot(i, sel)}
        />
      ))}
    </div>
      {/* Coverage disclaimer: we let you search any occupation (transparency),
          but BLS employment data doesn't exist for all of them. Sits outside the
          brass box so it doesn't compete with the "select here" focus. */}
      <p
        style={{
          fontFamily: FONT,
          fontSize: 11,
          lineHeight: 1.4,
          color: 'hsl(var(--muted-foreground))',
          margin: '6px 2px 0',
        }}
      >
        You can search any occupation. Not all have BLS employment data: when it&apos;s missing, Chart 1 omits that line
        (and says so) while Chart 2 still compares abilities.
      </p>

      {/* Browse-all trigger: opens a glossary-style drawer listing every
          occupation with its SOC code, for people who'd rather scan than search. */}
      <button
        type="button"
        onClick={() => setBrowseOpen(true)}
        style={{
          marginTop: 8,
          padding: '5px 10px',
          fontFamily: FONT,
          fontSize: 12,
          letterSpacing: '0.04em',
          color: 'hsl(var(--foreground))',
          background: 'transparent',
          border: `1px solid ${BORDER}`,
          cursor: 'pointer',
          alignSelf: 'flex-start',
          width: 'fit-content',
        }}
      >
        Browse all occupations
      </button>

      {browseOpen && (
        <BrowseDrawer
          occs={allOccs}
          loading={occsLoading}
          error={occsError}
          query={browseQuery}
          onQuery={setBrowseQuery}
          onClose={() => setBrowseOpen(false)}
          slot1={initial[0]?.soc ?? ''}
          slot2={initial[1]?.soc ?? ''}
          chip1={jobColors[0]}
          chip2={jobColors[1]}
          onPick={(index, soc, title) => selectSlot(index, { soc, title })}
        />
      )}
    </div>
  )
}

// Full-height right-side drawer listing every occupation, searchable, with an
// "as Occ 1 / as Occ 2" action per row. Chrome uses the site's CSS vars so it
// flips with the theme like the rest of the picker.
function BrowseDrawer({
  occs,
  loading,
  error,
  query,
  onQuery,
  onClose,
  slot1,
  slot2,
  chip1,
  chip2,
  onPick,
}: {
  occs: AllOcc[]
  loading: boolean
  error: boolean
  query: string
  onQuery: (q: string) => void
  onClose: () => void
  slot1: string
  slot2: string
  chip1: string
  chip2: string
  onPick: (index: number, soc: string, title: string) => void
}) {
  const base = (s: string) => s.split('.')[0]
  const q = query.trim().toLowerCase()
  const filtered = q
    ? occs.filter((o) => o.title.toLowerCase().includes(q) || o.soc_code.toLowerCase().includes(q))
    : occs

  // Group into SOC major groups (rows already arrive ordered by group then
  // title). While searching, every matching group is force-expanded so hits are
  // never hidden inside a collapsed section.
  const groups: { name: string; items: AllOcc[] }[] = []
  const groupIdx = new Map<string, number>()
  for (const o of filtered) {
    const name = o.major_group_name ?? 'Other'
    let gi = groupIdx.get(name)
    if (gi == null) {
      gi = groups.length
      groupIdx.set(name, gi)
      groups.push({ name, items: [] })
    }
    groups[gi].items.push(o)
  }
  const searching = q.length > 0
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const slotBtn: React.CSSProperties = {
    padding: '2px 7px',
    fontFamily: FONT,
    fontSize: 11,
    background: 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <>
      {/* Backdrop starts below the 64px sticky site header. */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
      />
      <div
        style={{
          position: 'fixed',
          top: 64,
          right: 0,
          height: 'calc(100vh - 64px)',
          width: 'min(420px, 94vw)',
          background: 'hsl(var(--popover))',
          borderLeft: `1px solid ${BORDER}`,
          boxShadow: '0 0 24px rgba(0,0,0,0.25)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT,
          color: 'hsl(var(--foreground))',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>All occupations</span>
          <button
            onClick={onClose}
            aria-label="Close occupation list"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'hsl(var(--muted-foreground))' }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filter by role or SOC code…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 8px',
              fontFamily: FONT,
              fontSize: 13,
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: `1px solid ${BORDER}`,
              outline: 'none',
            }}
          />
          {!loading && !error && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
              {filtered.length} of {occs.length} occupations
            </div>
          )}
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 0 20px' }}>
          {loading && <div style={{ padding: '10px 14px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Loading…</div>}
          {error && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
              Could not load the occupation list. Close and try again.
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>No matching occupations.</div>
          )}
          {!loading &&
            !error &&
            groups.map((g) => {
              const open = searching || expanded.has(g.name)
              return (
                <div key={g.name}>
                  {/* Sticky group header — click to expand/collapse. */}
                  <button
                    type="button"
                    onClick={() => toggle(g.name)}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 14px',
                      fontFamily: FONT,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      color: 'hsl(var(--foreground))',
                      background: 'hsl(var(--muted))',
                      border: 'none',
                      borderTop: `1px solid ${BORDER}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', width: 8 }}>{open ? '▼' : '▶'}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{g.name}</span>
                    <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>{g.items.length}</span>
                  </button>
                  {open &&
                    g.items.map((o) => {
                      const isSlot1 = base(o.soc_code) === base(slot1)
                      const isSlot2 = base(o.soc_code) === base(slot2)
                      return (
                        <div
                          key={o.soc_code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 14px 6px 26px',
                            borderBottom: '1px solid hsl(var(--muted))',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.35 }}>
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>{o.soc_code}</span> {o.title}
                          </div>
                          <button
                            type="button"
                            disabled={isSlot1 || isSlot2}
                            onClick={() => onPick(0, o.soc_code, o.title)}
                            title={isSlot2 ? 'Already in Occupation 2' : 'Set as Occupation 1'}
                            style={{
                              ...slotBtn,
                              border: `1px solid ${chip1}`,
                              color: isSlot1 ? 'hsl(var(--muted-foreground))' : chip1,
                              opacity: isSlot1 || isSlot2 ? 0.4 : 1,
                              cursor: isSlot1 || isSlot2 ? 'default' : 'pointer',
                            }}
                          >
                            {isSlot1 ? 'Occ 1 ✓' : 'as Occ 1'}
                          </button>
                          <button
                            type="button"
                            disabled={isSlot1 || isSlot2}
                            onClick={() => onPick(1, o.soc_code, o.title)}
                            title={isSlot1 ? 'Already in Occupation 1' : 'Set as Occupation 2'}
                            style={{
                              ...slotBtn,
                              border: `1px solid ${chip2}`,
                              color: isSlot2 ? 'hsl(var(--muted-foreground))' : chip2,
                              opacity: isSlot1 || isSlot2 ? 0.4 : 1,
                              cursor: isSlot1 || isSlot2 ? 'default' : 'pointer',
                            }}
                          >
                            {isSlot2 ? 'Occ 2 ✓' : 'as Occ 2'}
                          </button>
                        </div>
                      )
                    })}
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}

function SlotRow({
  label,
  chip,
  value,
  otherSoc,
  onSelect,
}: {
  label: string
  chip: string
  value: OccSlot
  otherSoc: string
  onSelect: (sel: OccSlot) => void
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<OccResult[]>([])
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)

  // Debounced search while typing (≥2 chars).
  useEffect(() => {
    if (!focused) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/onet/search?q=${encodeURIComponent(q)}&limit=8`)
        const data = res.ok ? await res.json() : []
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, focused])

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const displayLabel = value.soc ? `${value.soc} — ${value.title}` : ''
  const isSearching = query.trim().length >= 2
  // Don't offer the occupation already in the other slot (no duplicates).
  const options = (isSearching ? results : SUGGESTIONS).filter((r) => r.soc_code !== otherSoc)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, background: chip, flexShrink: 0 }} />
      <span style={{ color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{label}</span>
      <div ref={boxRef} style={{ position: 'relative', flex: 1, minWidth: 220 }}>
        <input
          value={focused ? query : displayLabel}
          placeholder="Search role or SOC code…"
          onFocus={() => {
            setFocused(true)
            setQuery('')
          }}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            // Extra right padding so the text never runs under the caret.
            padding: '4px 22px 4px 8px',
            fontFamily: FONT,
            fontSize: 12,
            color: 'hsl(var(--foreground))',
            border: `1px solid ${BORDER}`,
            background: 'hsl(var(--background))',
            outline: 'none',
          }}
        />
        {/* Caret affordance: signals the field opens a list (combobox). Rotates
            up while the dropdown is open. pointer-events:none so clicks fall
            through to the input. */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: `translateY(-50%) ${focused ? 'rotate(180deg)' : ''}`,
            fontSize: 9,
            lineHeight: 1,
            color: 'hsl(var(--muted-foreground))',
            pointerEvents: 'none',
            transition: 'transform 0.12s ease',
          }}
        >
          ▼
        </span>
        {focused && (
          <ul
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 20,
              margin: 0,
              padding: 0,
              listStyle: 'none',
              maxHeight: 280,
              overflowY: 'auto',
              background: 'hsl(var(--popover))',
              border: `1px solid ${BORDER}`,
              borderTop: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
            }}
          >
            <li style={{ padding: '5px 8px', fontSize: 11, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', letterSpacing: '0.04em' }}>
              {isSearching ? 'Results' : 'Examples — or type a role or SOC code'}
            </li>
            {isSearching && loading && options.length === 0 && (
              <li style={{ padding: '6px 8px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Searching…</li>
            )}
            {isSearching && !loading && options.length === 0 && (
              <li style={{ padding: '6px 8px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>No matches</li>
            )}
            {options.map((r) => (
              <li key={r.soc_code}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // onMouseDown (not onClick) so it fires before the input blurs.
                    e.preventDefault()
                    onSelect({ soc: r.soc_code, title: r.title })
                    setFocused(false)
                    setQuery('')
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    fontFamily: FONT,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{r.soc_code}</span> — {r.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
