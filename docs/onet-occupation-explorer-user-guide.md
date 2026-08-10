# The Occupation Explorer — User Guide

**Where:** `/onet` on the Irreducibly Human site.

The Occupation Explorer lets you pick **two occupations** and compare them two ways:

1. **Chart 1 — Employment:** how each occupation's employment has moved since 2018, set against major AI milestones.
2. **Chart 2 — Abilities:** the human abilities each occupation leans on, using O\*NET ratings.

The lens throughout is the Irreducibly Human question: *which human abilities are hardest for AI to replicate.*

Everything on the page is driven by the two occupations you choose. Change the pair and both charts, the legend, and the URL update together.

---

## 1. Choosing occupations

### The picker (top right, brass-outlined box)

The box titled **"Select two occupations to compare"** is the main control. It has two slots:

- **Occupation 1** — shown in the first colour (black in light mode, parchment in dark).
- **Occupation 2** — shown in the second colour (dark red in light mode, brighter red in dark).

**To choose an occupation:**

1. Click a slot's field. A **▼ caret** on the right of the field flips up to show the list is open.
2. On focus (before you type), a short list of **example occupations** appears — all verified to have employment data, so they render fully.
3. Start typing to search. You can search by:
   - **Role name** — e.g. `nurse`, `software`, `carpenter`.
   - **SOC code** — e.g. `29-1141` or `15-1252.00`.
4. Click a result to select it. The charts refresh immediately.

**Notes:**

- You can't put the same occupation in both slots — the one already chosen in the other slot is filtered out of the results.
- The fine print under the box explains coverage: **you can search any occupation, but not all have BLS employment data.** When employment data is missing, Chart 1 says so and omits that line, while Chart 2 still compares abilities.

### Browse all occupations (drawer)

If you'd rather scan than search, click **"Browse all occupations"** under the picker. A drawer slides in from the right listing **all ~1,000 occupations**, organised for easy scanning:

- Occupations are grouped into the **23 SOC major groups** (e.g. *Computer and Mathematical Occupations*, *Healthcare Practitioners and Technical Occupations*).
- Each group header shows its **name and count** and starts **collapsed** — click a header to expand or collapse it.
- The **filter box** at the top narrows the list by role name or SOC code; any group with a match **auto-expands** so results are never hidden.
- Each row has two buttons: **as Occ 1** and **as Occ 2** (coloured to match each slot). Click one to place that occupation into that slot.
- An occupation already selected shows **Occ 1 ✓ / Occ 2 ✓**, and its buttons are disabled so you can't duplicate it or compare it with itself.

Close the drawer with the **×** or by clicking the dimmed backdrop.

### Sharing a view

The chosen pair lives in the URL as `?soc=A,B` (e.g. `/onet?soc=15-1252.00,15-1251.00`). **Copy the URL to share the exact comparison** — opening it reproduces both charts and the picker. Editing the pair updates the URL automatically.

---

## 2. Chart 1 — Employment

A line chart of each occupation's **employment index**, where **2018 = 100**.

### Reading the chart

- **The index:** each occupation's employment is rebased to 2018 = 100. A value of **48** means employment fell to 48% of its 2018 level; **126** means it grew to 126%. Because both lines share the 2018 baseline, they compare directly.
- **The dashed horizontal line** marks the 2018 baseline (index = 100).
- **The vertical "PROJECTED" divider** separates real **BLS data (2018–2024)** on the left from the projected zone on the right.
- **AI milestone labels** sit below the year axis (GPT-3, GitHub Copilot, ChatGPT, GPT-4, Claude releases, etc.), connected to the axis by thin lines, so you can line up employment shifts against AI capability jumps.
- **Dotted faint segments** mark an *intentional* data gap (missing years), not a rendering error.

### Interacting

- **Hover anywhere** on the plot: a crosshair follows your cursor and a tooltip shows each occupation's exact index value and employment count for that year.
- Past the last real year (in the empty projected zone), the tooltip simply disappears rather than reporting "No data" for everything.
- **Hover a milestone label** below the axis for its date and a short description.

### The right-hand panel

- **Legend** — the colour of each occupation's line, plus the meaning of the dashed baseline and the dotted data-gap style.
- **What the index means** — a reminder of the 2018 = 100 rebasing.
- **The milestone timeline** — what the labels below the axis represent.

### When an occupation has no employment data

Some occupations (e.g. many military codes, and some newer computing SOCs) have no BLS employment series. In that case a **notice appears below the chart** naming the occupation and confirming its line isn't shown — and reminding you that **Chart 2 still compares its abilities**.

---

## 3. Chart 2 — Abilities

Compares the two occupations across O\*NET **abilities**, rated on the **Level (LV) scale (0–7)** — how much of each ability the job requires. The x-axis runs from **MINIMAL** (near 0, shaded) to **ADVANCED** (near the top).

### Two views (toggle, top left of the chart)

- **COMPARISON** — a dumbbell plot: for each ability, both occupations' ratings are shown, with a tick marking the workforce average. Best for reading the level each job needs, ability by ability.
- **TOP DIFFERENCES** — a diverging bar chart ranking the abilities where the two occupations differ most. Solid bars mean the difference is clear (confidence intervals don't overlap); hollow/`~` bars mean the difference is within the noise. *(This view needs exactly two occupations and enough width; otherwise the COMPARISON view stays on.)*

### Category tabs

Above the chart, tabs switch the ability **category** shown (Cognitive, Sensory, Physical, Psychomotor, etc.), so you can focus on one family of abilities at a time.

### Interacting

- **Hover a dot or bar** for its exact value, confidence interval, and sample size.
- **Tap an ability's name** to open the Glossary focused on that term's definition.

### When an occupation has no ability data

If O\*NET has no ability profile for a chosen occupation, a **notice appears** naming it and confirming it isn't plotted, rather than showing a broken half-empty chart.

---

## 4. The Glossary

A **floating "? GLOSSARY" button is pinned to the bottom-right** of the screen, so it's reachable no matter how far you've scrolled.

- Click it to open the glossary drawer.
- It defines every ability term, the ability categories, the chart terms (confidence interval, workforce average), and the O\*NET / BLS data sources.
- Use the **search box** to filter terms. Tapping an ability name in Chart 2 opens the glossary pre-filtered to that term.

---

## 5. Light and dark mode

The page follows the **site-wide light/dark toggle** (the sun/moon in the header). There is no separate control here and you never need to switch twice — the whole page, both charts, the legend, the picker, and the glossary all repaint together.

Occupation colours adapt so both lines stay visible:

| Slot | Light mode | Dark mode |
|------|-----------|-----------|
| Occupation 1 | Black | Parchment (light) |
| Occupation 2 | Dark red | Brighter red |

---

## Quick reference

| I want to… | Do this |
|------------|---------|
| Pick occupations by name/code | Type in the picker slots (top right) |
| See suggestions | Click a slot before typing |
| Browse every occupation | "Browse all occupations" → expand a group |
| Share a comparison | Copy the URL (`?soc=…`) |
| See exact employment numbers | Hover Chart 1 |
| Read an AI milestone | Hover its label below Chart 1's axis |
| Rank the biggest ability gaps | Chart 2 → TOP DIFFERENCES |
| Look up a term | Bottom-right "? GLOSSARY" button, or tap an ability name |
| Switch light/dark | Site header sun/moon toggle |
