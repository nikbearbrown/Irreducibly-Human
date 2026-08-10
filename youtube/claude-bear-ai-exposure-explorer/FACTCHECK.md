# FACTCHECK — claude-bear-ai-exposure-explorer

Source: `data/employment.json` (BLS OEWS via Neon export, received 2026-08-10,
renamed from `Irreducibly-Human/data/video.json`, 141 rows, validated identical
to Bear's paste). Abilities claims (B18, B25, B31) remain UNVERIFIED until
`data/abilities.json` lands.

| Beat | Claim | Verdict | Numbers | Fix |
|------|-------|---------|---------|-----|
| B07 | "one-twenty-six means grew a quarter; forty-eight means halved" | **CONFIRMED — exactly** | Developers 2024 = 126.44 (2023 peak 126.63); Programmers 2024 = 47.67 | None. The example numbers in the narration ARE the real endpoints of the default pair. |
| B08 | Default pair "lines tear apart" | **CONFIRMED** | 126.44 vs 47.67 — a 79-point spread from the same 2018 baseline | None |
| B11 | "the gap is real, whatever caused it" | CONFIRMED, but **incomplete in a way this series can't ship** | Programmer index was 230.28 in 2000 → 100 by 2018 → 47.67 by 2024. The decline started ~2001; 100→57.6 happened by 2022, i.e. MOST of the post-2018 fall predates chatbot coding tools | **REWRITTEN** — beat now names the 2001 start (offshoring, reclassification, the cloud): "AI may be accelerating this. It did not start it." |
| B13 | Developers data gap 2019–2020, chart says so | **CONFIRMED** | 15-1252 has no 2019/2020 rows (BLS folded it into a combined code); API emits the warning | None |
| B23/B24 | Nurses "hold through everything"; CSRs slide, steepening with chat | **CONFIRMED (calibrated)** | Nurses rise EVERY year: 100 → 111.18 (2024). CSRs: 2019 peak 101.67 → 94.93; the single steepest post-2018 drop is 2023→2024 (99.56→94.93, −4.63) | B24 softened from "slides" drama to "drifts below baseline, newest year is its steepest drop yet" — magnitude honest (−5 pts vs 2018), timing claim (steepest at the chat era) true |
| B29/B30 | Designer line "wobbles where image generation arrives"; carpenters barely register | **REFUTED** | Designers: 2022 = 97.28 → 2023 = 97.66 → 2024 = 98.37 — RISING through the image-gen era; the visible dip is 2020 (92.48, pandemic), recovered. Carpenters 2024 = 97.08 — statistically the same place. Carpenters' real drama is 2008–2012 (137 → 79, housing crash), unrelated to AI | **ACT V REWRITTEN** — the act is now "the chart that refuses to panic": the predicted design collapse is not (yet) in the employment data; the honest mechanisms (task-level exposure before headcount; production vs direction) carry the act |
| B33 | "exposure doesn't follow prestige" inversion | **REVISED** | The clean inversion isn't in this data either — both lines end ~97–98 | Beat now teaches the bigger lesson: discourse and data can disagree; check the ability mix and next year's numbers |
| B37 | "not every occupation has employment data" | CONFIRMED by API design (series omitted when no BLS rows; on-page note) | — | None |

## Deltas the narration may now use verbatim (all from the export)

- Programmers 2000 peak: 230.28. 2018: 100. 2024: **47.67**.
- Developers 2024: **126.44** (peak 126.63 in 2023); gap years 2019–2020.
- Nurses 2024: **111.18**; positive every single year 2019–2024.
- CSRs: 2019 peak 101.67; 2024 **94.93**; 2023→2024 = −4.63, steepest post-2018 step.
- Designers 2024: **98.37**; pandemic low 92.48 (2020); rising 2022→2024.
- Carpenters 2024: **97.08**; housing-crash trough 79.00 (2012).

## Still open

- Milestone timing claims (B09, B24 "right as scripted chat got good", B30) —
  need `data/milestones.json` to anchor which labels sit at which years.
- Ability-profile claims (B18, B25, B31 top-differences contents) — need
  `data/abilities.json`; the named abilities are expectations until then.
