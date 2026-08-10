# The Occupation Explorer — Design Notes & Future Scope

This document explains *how* the Occupation Explorer (`/onet`) is built, the reasoning behind the significant decisions, and what remains on the roadmap.

---

## 1. What it is

A single page that compares two occupations through the Irreducibly Human lens (*what AI can and can't do*), combining:

- **Chart 1 (EmploymentChart):** a BLS employment-index line chart (2018 = 100) with AI-milestone markers.
- **Chart 2 (ProfileChart):** an O\*NET ability comparison, with a dumbbell "comparison" view and a diverging-bar "top differences" view.
- A searchable **occupation picker** and a **browse-all** drawer, both driving the charts.

Data comes from **O\*NET** (abilities, occupation titles, major groups) and the **U.S. Bureau of Labor Statistics** (employment), served from a shared **Neon Postgres** database via internal API routes.

---

## 2. Architecture

### Rendering model

- **Next.js App Router.** The page (`app/onet/page.tsx`) is a **server component**: it parses `?soc`, fetches employment + abilities data, resolves titles, and passes plain serialisable props to client components. `export const dynamic = 'force-dynamic'` because the data is picked per-request.
- **Charts are client components** using **D3 for imperative SVG rendering** inside a `useEffect`, sized by a `ResizeObserver` on their container. This keeps D3's layout math (scales, axes, collision handling) in one place while React owns the surrounding chrome and tooltips.
- **Supporting client components:** `OccupationPicker` (search + browse drawer) and `InfoPanel` (Chart 1 legend + explainer boxes).

### Files

```
app/onet/
  page.tsx              server component: data fetch + layout
  OccupationPicker.tsx  two-slot search + "browse all" drawer
  InfoPanel.tsx         Chart 1 legend / explainer (theme-aware)
  charts/
    EmploymentChart.tsx BLS index line chart + milestones
    ProfileChart.tsx    O*NET ability dumbbell / diverging bars + glossary
app/api/onet/
  employment/           BLS employment index by SOC
  abilities/            O*NET ability ratings by SOC
  search/               role/SOC search (title + prefix browse)
  occupations/          full occupation list (soc + title + major group)
  occupation/[soc]/     single-occupation detail
lib/onet-glossary.ts    ability/category/term definitions + framing copy
```

### The URL is the single source of truth

The selected pair lives entirely in `?soc=A,B`. The picker has **no internal selection state** — selecting an occupation navigates to a new `?soc`, which re-renders the server component with fresh data and a fresh `initial` pair. This makes every view **shareable and bookmarkable** for free, and removes a whole class of "UI and data disagree" bugs.

---

## 3. Key decisions and the thinking behind them

### `responsiveScale` opt-in, and a preserved reference page

The original chart page (`/onet/test`) is kept **byte-identical** as a reference. All the compact/responsive work is gated behind an opt-in `responsiveScale` prop, so the new treatment never risks regressing the known-good baseline. `/onet` passes `responsiveScale`; `/onet/test` does not.

### Positional colours + a dual palette for dark mode

Occupations are coloured **by slot, not by identity** (Occupation 1 vs Occupation 2), so the scheme is occupation-agnostic. Job 1 is near-black in light mode — deliberately, to match the rest of the site — but near-black **disappears on a dark background**. So there are two palettes: light (`black` / `dark red`) and dark (`parchment` / `brighter red`). The server can't know the theme, so it passes **both** palettes; the client components pick the right one via `useTheme`. This is why Job 1 stays visible in both modes without the viewer ever toggling twice.

### Theming split: CSS vars for chrome, `useTheme` for data

Page and panel **chrome** (text, borders, backgrounds) uses the site's existing shadcn CSS variables (`hsl(var(--foreground))`, `--border`, `--muted`, …), which already flip on the `.dark` class — so the server component becomes theme-aware with no client hook. Only the **data colours** (occupation lines/dots/swatches), which must invert rather than merely shade, are chosen in JS via `useTheme`. One theme switch (the site header) drives everything.

### Dynamic Y-domain (Chart 1)

The employment axis fits the actual data rather than a fixed clamp: it always includes the 2018 = 100 baseline, floors at 0, pads ~10%, and has no hard ceiling. This handles occupations whose index diverges widely (e.g. one at 38, another at 155) without clipping either line — an earlier fixed 30–150 clamp pushed lines off-chart.

### Transparency over curation ("open search + disclaimer")

We let users search **any** occupation, even those without BLS employment data, rather than hiding them behind a curated list. Not every occupation has an employment series, so:

- A **coverage disclaimer** under the picker sets the expectation up front.
- A **per-occurrence notice** on each chart names any chosen occupation with no data and explains what is/isn't shown.

This fits the site's "no hype, be honest about the data" voice and avoids dead-end confusion when a line silently fails to appear.

### Title fallback

An occupation with no employment series also has no title from that response, so it would render as a bare SOC code. When that happens the server does a **parallel fallback lookup** against the search API (a digit query = SOC-prefix browse) to recover the real title, so notices and legends always read as human names.

### Crosshair "No data" suppression

Hovering the empty projected zone used to print "No data" for every occupation. Now a per-series row is dropped once you're past that series' last real year (an *internal* gap still shows "No data", since that's meaningful signal); if nothing is left to report the tooltip hides entirely while the crosshair stays for position feedback.

### Long-title handling (Chart 1)

Long occupation names (e.g. "First-Line Supervisors of Construction Trades and Extraction Workers") are **wrapped and capped to two lines with an ellipsis** at the line-end label — the full name is always in the legend. A **collision-avoidance pass** then nudges overlapping end-labels apart vertically, so two nearby trailing labels never sit on top of each other.

### Browse-all grouped by SOC major group

1,000+ occupations is unscannable as a flat list, so the drawer groups them into the **23 SOC major groups**, collapsible, with counts. Groups start collapsed for a tidy landing view; a search auto-expands any group with a match so results are never buried.

### Floating glossary

The glossary trigger is a **fixed bottom-right button** rather than an inline one, so definitions are one click away regardless of scroll position. It sits below the drawer's z-index so the drawer's own backdrop covers it while open.

---

## 4. Data & robustness

- **Input validation:** `?soc` is validated against a SOC regex, deduped by base code, and capped at two. Garbage falls back to the demo pair; a valid-but-dataless code is *kept* (it's not malformed — it just triggers the no-data notice).
- **Tolerant matching:** SOC codes are matched on their base (`29-1141` vs `29-1141.00`) because the employment and abilities APIs echo different formats.
- **Graceful degradation:** the occupation-detail-style queries use `Promise.allSettled` server-side so one failing query returns `[]` rather than 500-ing the page.

---

## 5. Performance notes

- The full occupation list (~1,000 rows) is fetched **once**, the first time the browse drawer opens, then filtered client-side — no per-keystroke round-trips.
- Derived values that would otherwise recompute on every tooltip-driven re-render (`noDataSeries`, `noAbilityData`, `distinctSocCodes`, `categories`) are memoised.
- D3 draw effects have correct dependency arrays and clean up their `ResizeObserver`s; the picker's search debounce and outside-click listener are cleaned up too.
- No credentials or connection strings ever cross into client code — all DB access is server-side in the API routes.

---

## 6. Future scope (not yet done)

Ordered roughly by value.

### Near-term / go-live
- **Deploy:** commit + push to `main` (Vercel auto-deploy) and add `/onet` to the CLAUDE.md site-structure section. *(Held pending explicit go-ahead.)*
- **Mobile / responsive fallback (deferred):** the layout is a fixed two-column split (`66.6667vw` chart + `flex:1` panel). It needs a narrow-screen stack before it's truly mobile-ready; currently desktop-oriented. Fine for a shared link, not yet for phone traffic.

### Content
- **Wording review:** the glossary definitions and interpretive framing in `lib/onet-glossary.ts`, plus the page intro copy, are drafted and pending review in the program's voice (Prof. Brown).
- **Occupation → tier mapping:** the curriculum's 7-tier cognition taxonomy classifies *capacities*, not occupations. There is no occupation→tier data, so the tier subtitles on Chart 1 are hand-authored for the demo pair only. A real, sourced mapping is an editorial decision that's currently deferred.

### Features
- **Ability sort control (Chart 2):** a button beside the category tabs to sort the active category by Occupation 1's own 0–7 level, for "what does *this* job need most" reading.
- **Per-ability automatability tag (Level C):** tagging each ability with how automatable it is — deferred until there's a sourced ability→tier mapping to back it.

### Polish / tech debt
- **Sizing pass:** bake in the "~80% zoom" feel that looked best in review (a fixed ~20% reduction of chart chrome), and decide charts-only vs whole-page.
- **Refactor:** centralise the design tokens (font sizes, colours, box styles) currently repeated across the page and chart files, and unify the SVG-vs-JSX footnote/legend patterns. The dark-mode pass and the cleanup pass both highlighted how much of this is duplicated.
- **Direct data-layer calls:** the server component currently self-fetches its own API routes over HTTP; calling the data layer directly would save a round-trip. Left as-is to keep the cleanup pass scoped.
