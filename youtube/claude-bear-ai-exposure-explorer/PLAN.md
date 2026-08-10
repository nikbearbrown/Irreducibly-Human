# PLAN v2.1 — claude-bear-ai-exposure-explorer

**Genre:** deep-explainer chassis, with a genre deviation signed by Bear (2026-08-10):
**no screenshots, no pantry** — the documentary lane is replaced by a **SITE lane**:
Remotion components that SIMULATE USING the Explorer (brix-style scripted
performance), skinned from the site's actual source code and driven by real data
exported from Neon. The vox quota is void by design; the SITE lane is this
episode's "archive footage."
**Voice:** Bear's **nbb clone** (F5-TTS, `nbbhuman` @ ckpt `model_2500`, free) —
`metadata.engine: "nbb"`; audio generation runs FROM the Mac (AICR Slurm
round-trip), per books/CLAUDE.md.
**Slug:** `claude-bear-ai-exposure-explorer` → `Irreducibly-Human/youtube/`
**Destination:** YouTube, then the front page — `EXPLORER_VIDEO_ID` in
`app/page.tsx` (already wired).
**Estimated landing:** ~38 body beats ≈ 6:30–7:30. Duration is an output.

## The SITE lane — simulate using the Explorer

One scene family, `ExplorerSim`, composed of sub-components skinned 1:1 from the
real source (the repo IS the spec — no invention):

| Component | Skinned from | Simulates |
|---|---|---|
| `SiteChrome` | `components/Header/Header.tsx`, `/onet` page layout | The page frame: sticky header (Home / The Idea / AI Exposure Explorer, YouTube button), title, intro block |
| `PickerSim` | `app/onet/OccupationPicker.tsx` | Brass select-two box: cursor moves, click, typed query (char-by-char), debounce dropdown, selection commit |
| `EmploymentSim` | `app/onet/charts/EmploymentChart.tsx` + `data/employment.json` + `data/milestones.json` | Chart 1: axes in, index lines DRAW (Job 1 black #0D0D0D, Job 2 red #8B0000), dashed 2018 baseline, dotted data-gap segments, milestone labels under the axis; camera pushes scripted per beat |
| `AbilitiesSim` | `app/onet/charts/ProfileChart.tsx` + `data/abilities.json` | Chart 2: COMPARISON overlay, TOP DIFFERENCES toggle click + animated re-sort, glossary panel open |
| `DrawerSim` | `OccupationPicker.tsx` (BrowseDrawer) | Browse-all drawer: slide-in, grouped list scroll, "as Occ 1 / as Occ 2" pick |
| `UrlSim` | — | Browser URL bar close-up: `?soc=A,B` mutates as the pair changes; copy-link moment |

Simulation grammar: one deliberate cursor, human-speed typing (~80ms/char + think
pauses), UI reactions at real-feel latencies, reveals land ON the spoken word
(word clock from align). Charts animate from the REAL numbers — nothing drawn
that the data can't back. Terracotta #D97757 stays the one annotation accent
OVER the site's own palette (the site skin keeps its own colors; it's the
subject, not the brand).

## The data contract (replaces the shopping list / Gate D2)

Gate D2 is now a **DATA gate**: four files in the reel folder's `data/`,
exported by Bear from Neon SQL Editor (SQL provided in chat, one paste per
file). The build does not proceed to chart scenes while any is missing —
`MISSING:` line in BUILD-LOG.

```
data/employment.json    bls_employment rows for the 6 BLS codes
data/milestones.json    ai_milestones rows (display_on_chart = TRUE)
data/abilities.json     onet_abilities LV rows for the 6 O*NET codes
data/occupations.json   onet_occupations titles/groups for the 6 codes
```

Six occupations: 15-1252.00 / 15-1251.00 / 29-1141.00 / 43-4051.00 /
27-1024.00 / 47-2031.00 (BLS codes: strip `.00`).

## The three comparisons

| # | Pair | Picked on screen via | The story |
|---|------|---------------------|-----------|
| 1 | Software Developers vs Computer Programmers | default state | Same field, opposite exposure: design-and-judgment vs implementing specs |
| 2 | Registered Nurses vs Customer Service Reps | typed search, both slots | Embodied relational care (Tiers 2–3) vs scripted pattern work (Tier 1) |
| 3 | Graphic Designers vs Carpenters | search + browse drawer | The inversion: the creative desk job is more exposed than the trade |

**FACTCHECK:** every curve-direction claim below is an expectation until checked
against `data/employment.json`. The narration locks only after the numbers land.

## Act map

```
B00  COLD OPEN (ClaudeComposerAsk — exempt)
ACT I    The Tool                B01–B05
ACT II   Chart 1 — Employment    B06–B13
ACT III  Chart 2 — Abilities     B14–B21
ACT IV   Nurse vs Rep            B22–B27
ACT V    Designer vs Carpenter   B28–B33
ACT VI   Play With It            B34–B38
VERDICT → YOUR TURN → TITLE      (exempt)
```

## Beats (lane + simulation spec + narration ~25–45 words)

### B00 — Cold open (exempt)
`ClaudeComposerAsk`. Bear (verbatim per Bear, light polish): "Hey Claude — what
is the Irreducibly Human AI Exposure Explorer, and can you SHOW me how to use
it?" The ask lands answered — Claude opens the Explorer and the whole body IS
the showing. Bear signs in.

### ACT I — The Tool
| ID | Lane | Sim / visual | Narration draft |
|----|------|--------------|-----------------|
| B01 | CARD | Act card | — |
| B02 | REMOTION | Job as a bundle of ability bars, not one block | "First, the premise. A job isn't one thing AI can or can't do. It's a bundle of abilities — and exposure depends on which abilities carry the paycheck. That's what this tool measures." |
| B03 | MANIM | Seven-tier isotype strip, 4–7 terracotta | "The lens is a seven-tier map of human intelligence. Machines own the bottom tier. The top four — judgment, causal reasoning, collective work, wisdom — they haven't reached. Keep that map in mind." |
| B04 | SITE | `SiteChrome`: page assembles — header, title, intro; slow settle | "This is the AI Exposure Explorer. Two occupations, two charts, public data. Built by Abisha Vadukoot, Mickey Davidovic, and Nik Bear Brown on O*NET and Bureau of Labor Statistics numbers." |
| B05 | SITE | `PickerSim`: cursor circles the brass box, hovers slot 1, dropdown peeks | "The controls are one box: pick Occupation one, pick Occupation two. Search by name, search by code, or browse all thousand of them. Everything on screen follows from that pair." |

### ACT II — Chart 1: Employment
| ID | Lane | Sim / visual | Narration draft |
|----|------|--------------|-----------------|
| B06 | CARD | Act card | — |
| B07 | MANIM | Index explainer: lines pinned to 100 at 2018; 126 up, 48 down | "Chart one is an index, and the index is the whole trick. Every job starts at one hundred in 2018. A line at one-twenty-six means the job grew a quarter. Forty-eight means it halved." |
| B08 | SITE | `EmploymentSim`: default pair; axes in, both lines DRAW left→right from real data | "Here's the default pair. Software Developers against Computer Programmers. Same buildings, same degrees, same language — and the lines tear apart." *(verify)* |
| B09 | SITE | Camera pushes to the x-axis; milestone labels pop sequentially, terracotta ring | "Those labels under the axis are AI milestones — major model releases, coding assistants. They're the timeline the employment lines get read against. That's the question the chart puts in front of you." |
| B10 | REMOTION | "A timeline is a question, not a verdict" pattern | "And be careful: milestones next to a falling line is correlation. The chart lets you ask whether AI bent the curve. It does not settle it. Tools that pretend otherwise are lying to you." |
| B11 | MANIM | The two curves clean, gap shaded | "But the gap is real, whatever caused it. One job climbs, the other slides — and they're supposedly the same career. So the difference isn't 'tech.' The difference is what each job actually does all day." |
| B12 | REMOTION | Spec→code conveyor vs design/judgment loop | "Programmers, in the government's definition, implement specifications someone else wrote. Developers decide what to build, why, and whether it's working. One is Tier one work. The other lives in Tiers four and five." |
| B13 | SITE | `EmploymentSim`: camera to the dotted 2019–2020 gap; terracotta underline on the legend note | "One honesty note baked in: dotted segments are data gaps, and it says so — Software Developers wasn't even tracked separately for two years. The chart shows its seams instead of painting over them." |

### ACT III — Chart 2: Abilities
| ID | Lane | Sim / visual | Narration draft |
|----|------|--------------|-----------------|
| B14 | CARD | Act card | — |
| B15 | MANIM | Ability bar 0→7, LV scale | "Chart two switches sources: O*NET, the Labor Department's occupation database. Every job gets scored on dozens of human abilities, zero to seven. Not vibes — structured surveys of people actually doing the work." |
| B16 | SITE | `AbilitiesSim`: COMPARISON mode, both profiles fade in overlaid | "In comparison mode you see both ability profiles overlaid. Where the lines hug, the jobs need the same human machinery. Where they split, you're looking at the reason chart one tore apart." |
| B17 | SITE | Cursor clicks TOP DIFFERENCES; rows re-sort with animation | "Flip to Top Differences and the chart does the sorting for you: the abilities where these two jobs disagree most, ranked. This is the fastest way to read any pair. Start here." |
| B18 | REMOTION | Abilities→tiers mapping, judgment-family rows terracotta | "Now overlay the tier map. Originality, problem sensitivity, deductive reasoning — Tier four and five territory. Finger dexterity, near vision — embodied Tier two. The ability names tell you which tier pays the salary." |
| B19 | SITE | `AbilitiesSim`: glossary opens; a definition highlights | "Every ability name is defined — open the glossary and 'problem sensitivity' stops being jargon: telling when something is wrong or likely to go wrong. Read three definitions and the chart starts talking." |
| B20 | MANIM | State card: reading rule | "So here's the reading rule for the whole tool: the more a job's top abilities sit in the pattern tier, the more exposed it is. The more they sit in Tiers four through seven, the safer the ground." |
| B21 | CARD | Spark-line: "The ability mix IS the exposure." | — |

### ACT IV — Nurses vs Customer Service Reps
| ID | Lane | Sim / visual | Narration draft |
|----|------|--------------|-----------------|
| B22 | CARD | Act card | — |
| B23 | SITE | `PickerSim`: clears slot 1, types "registered n…", picks; types "customer…", picks; `EmploymentSim` redraws | "New pair, one search each: Registered Nurses against Customer Service Representatives. Both jobs are talking to people all day. The employment lines say the economy doesn't think they're remotely the same." *(verify)* |
| B24 | MANIM | Recreated curves, milestone ticks | "Nursing holds through everything — a pandemic, a hiring freeze, the model releases. Customer service slides, and the slide steepens right where scripted chat got good. Correlation, again. But a pointed one." *(verify)* |
| B25 | SITE | `AbilitiesSim`: TOP DIFFERENCES for the pair, top rows ringed | "Top Differences explains it. The nurse's lead: assisting and caring, physical work near people, judgment under uncertainty. The rep's profile leans on exactly the abilities a language model fakes best — scripted response, pattern lookup." |
| B26 | REMOTION | Hands + presence vs headset + script | "A nurse's job is Tier two and three — a body in a room, trust, hands. You can't download that. A script you read off a screen? That IS the training data." |
| B27 | CARD | Spark-line: "Talking to people isn't one skill." | — |

### ACT V — Graphic Designers vs Carpenters
| ID | Lane | Sim / visual | Narration draft |
|----|------|--------------|-----------------|
| B28 | CARD | Act card | — |
| B29 | SITE | `PickerSim` types "graphic…"; `DrawerSim` opens for Carpenters — browse, group, "as Occ 2"; `EmploymentSim` redraws | "Last pair, and it's the uncomfortable one. Graphic Designers against Carpenters — one from search, one from the browse drawer. A creative degree against a trade. Guess which line image generators showed up for." *(verify)* |
| B30 | MANIM | Curves, generative-image milestone tick emphasized | "The designer line wobbles where image generation arrives. The carpenter line barely registers that AI exists. Nobody's model swings a hammer on a wet roof in February." *(verify)* |
| B31 | SITE | `AbilitiesSim`: TOP DIFFERENCES; dexterity/stamina vs visualization/originality ringed | "The ability chart shows the split: the carpenter's edge is entirely embodied — dexterity, strength, spatial work in the physical world. The designer's profile concentrates in visualization and originality — production abilities the generators target first." |
| B32 | REMOTION | "Production ≠ Direction" — output stack vs taste/brief/judgment | "The nuance: what's exposed is design PRODUCTION — comps, variations, assets. Design judgment — reading a client, knowing which of forty options is right and why — that's Tier four. The title survives; the task list doesn't." |
| B33 | MANIM | Isotype inversion: desks vs hammers, exposure shading flipped | "So the clean hierarchy — creative work safe, manual work doomed — inverts. Exposure doesn't follow prestige. It follows the ability mix. That's the tool's whole argument, drawn by two jobs." |

### ACT VI — Play With It
| ID | Lane | Sim / visual | Narration draft |
|----|------|--------------|-----------------|
| B34 | CARD | Act card | — |
| B35 | SITE | `DrawerSim`: full drawer scroll through groups, filter typed | "Now it's yours. The browse drawer lists every occupation the government tracks, grouped — pick anything from anesthesiologists to zoologists. Or type your own job title into a slot and see what comes back." |
| B36 | SITE | `UrlSim`: URL bar close-up, `?soc=` mutates, copy flash | "Every comparison is a URL. The pair you picked rides in the address — copy it, text it to the friend who's wrong about automation, and the exact argument reopens on their screen." |
| B37 | REMOTION | Caveats state card | "Fine print, because this series does fine print: not every occupation has employment data — the chart says so when it's missing. Ability scores are surveys, not physics. And milestones are context, never proof." |
| B38 | CARD | Spark-line: "Look up your own job before someone else does." | — |

### Closing block (exempt — your-turn standard)
- **VERDICT** (`ClaudeVerdictArtifact`): one tool, two charts, three pairs; the
  index is the trick, Top Differences is the shortcut, the ability mix is the
  exposure.
- **YOUR TURN** (`ClaudeComposerAsk`, "Your turn.", read by Bear): "Open irreducibly.xyz/onet.
  Put YOUR occupation in slot one. Put the job everyone says is doomed in slot
  two. Flip Chart 2 to Top Differences and ask: which of my top abilities could
  a machine actually do? Send me the URL."
- **TITLE** (`ClaudeTitleOutro`).

## Lane histogram (38 body beats)

| Lane | Count | Share |
|------|-------|-------|
| SITE (simulated product, real data) | 12 — B04 B05 B08 B09 B13 B16 B17 B19 B23 B25 B29 B31 B35* B36* | 32% |
| MANIM | 8 — B03 B07 B11 B15 B20 B24 B30 B33 | 21% |
| REMOTION (concept/rhetoric) | 7 — B02 B10 B12 B18 B26 B32 B37 | 18% |
| CARD | 9 | 24% |

*Count as listed = 14; B35/B36 noted with asterisk — if the episode runs long at
previz, B35 folds into B29's drawer moment and B36 into the verdict. Vox = 0%
by signed deviation (no screenshots).*

Consecutive-lane check: SITE runs (B08–B09, B16–B17) are intentional — same
component, one camera script, the continuity is free because it's code, not
plates. No other >2 same-lane runs.

## Gates, revised

1. **Plan v2** — this file. **GATE: Bear approves.**
2. **DATA gate** — the four SQL exports land in `data/`. (SQL in chat.)
3. **factcheck** — curve claims vs `data/employment.json`; ability claims vs
   `data/abilities.json`; FACTCHECK.md. **GATE: claims hold.**
4. **GATE P** — narration on animated slate, then nbb audio FROM THE MAC
   (`generate_audio_nbb.py`, ssh alias `aicr`, ckpt `model_2500`).
5. **Audio lock** → align → word clock.
6. **Previz** (Gate D1) — `./art run`: SITE scenes may render as blocked-out
   frames first; Manim/Remotion real. **GATE: watch it.**
7. **Component build** — ExplorerSim family, skinned from the source files named
   above. Review cut → VISUAL QC → TYPECHECK → `./art final`.
8. Paste the YouTube ID into `EXPLORER_VIDEO_ID` on the front page.

## Build handoff (local session, from books/)

```
./brutalist-art/art todo  Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer
./brutalist-art/art run   Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer
```
