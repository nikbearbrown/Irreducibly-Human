# BUILD-PROMPT — claude-bear-ai-exposure-explorer

Paste-ready prompt for a local Claude Code session started in
`/Users/bear/Documents/CoWork/bear-textbooks/books/`. Everything below the
rule is the prompt.

---

Build the reel `Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer/`
with the brutalist-art toolkit (`./brutalist-art/art`). Read these first, in
order — they are the signed spec, not suggestions:

1. `Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer/PLAN.md` (v2.2 — approved by Bear)
2. `Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer/FACTCHECK.md`
3. `Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer/data/employment.json`
4. The deep-explainer skill + its parents (ai-explainer, explainer, your-turn), and `brutalist-art/EXAMPLES-CAMPAIGN.md` standing rules #1–#4

## What this episode is

A ~6:30–7:30 walkthrough of the AI Exposure Explorer (irreducibly.xyz/onet),
on the deep-explainer chassis with one SIGNED DEVIATION: **no screenshots, no
pantry, zero vox beats**. The documentary lane is a **SITE lane** — Remotion
components that SIMULATE USING the live tool, skinned 1:1 from the site's own
source code and driven by the real exported data. The repo is the visual spec:

- `Irreducibly-Human/components/Header/Header.tsx` + `app/onet/page.tsx` → `SiteChrome`
- `Irreducibly-Human/app/onet/OccupationPicker.tsx` → `PickerSim` (brass box #8B7536, slot chips, typed search with debounce dropdown) and `DrawerSim` (browse-all drawer, grouped list)
- `Irreducibly-Human/app/onet/charts/EmploymentChart.tsx` → `EmploymentSim` (Job 1 #0D0D0D, Job 2 #8B0000, dashed 2018 baseline, dotted data-gap segments, milestone labels under the axis)
- `Irreducibly-Human/app/onet/charts/ProfileChart.tsx` → `AbilitiesSim` (COMPARISON / TOP DIFFERENCES toggle with animated re-sort, glossary panel)
- `UrlSim` — browser URL bar close-up, `?soc=A,B` mutating, copy flash

Simulation grammar: one deliberate cursor, human-speed typing (~80 ms/char +
think pauses), UI reactions at real-feel latency, reveals landing ON the
spoken word from the align word clock. Charts animate from the REAL numbers in
`data/` — never invent a value the data can't back. The site keeps its own
palette (it is the subject); terracotta #D97757 is the one ANNOTATION accent
drawn over it. Bookends and non-SITE beats are standard CLAUDE-brand scenes.

Persona: BEAR HIMSELF (not Liam). Cold open B00 is `ClaudeComposerAsk`, ask
verbatim: "Hey Claude — what is the Irreducibly Human AI Exposure Explorer,
and can you SHOW me how to use it?" The whole body is Claude showing him.
Closing block is the your-turn standard (VERDICT → YOUR TURN read in full →
TITLE re-read); the YOUR TURN prompt text is in PLAN.md.

Voice: **nbb** (Bear's F5-TTS clone). `metadata.engine: "nbb"`, voice
`nbbhuman`, checkpoint `model_2500`. You run `generate_audio_nbb.py` yourself
from this Mac (ssh alias `aicr`, Slurm round trip) — that is why this build is
local. Kokoro is NOT the fallback; if nbb fails, stop and report.

## Order of work (each gate is Bear's, not yours)

1. **Data check.** `data/employment.json` is present and validated. If
   `data/milestones.json`, `data/abilities.json`, `data/occupations.json` are
   missing: log `MISSING:` in BUILD-LOG.md and ask Bear to run the SQL from
   the Cowork session (Neon SQL Editor; save each json_agg cell). Do not
   build chart scenes or lock milestone/ability narration without them.
2. **beat_sheet.json.** Author from PLAN.md v2.2 exactly — B00–B38 + closing
   block, lanes as planned (SITE/MANIM/REMOTION/CARD), narration as written
   (employment beats are factlocked; update any beat FACTCHECK.md marks open
   once the remaining data lands). Schema:
   `brutalist-art/runtime/schema/beat_sheet.schema.json`. SITE beats carry
   their simulation spec in the show block (component, camera, cursor script,
   which data file + SOC pair).
3. **GATE P.** Render the narration on an animated slate for Bear's read.
   Only after his sign-off: nbb audio → `mp3/beat-*.mp3`, `timings.json`,
   durations written back. Audio is the master clock; never hand-edit
   timings — re-generate and recompile.
4. **Previz (Gate D1).** `./brutalist-art/art run Irreducibly-Human/youtube/claude-bear-ai-exposure-explorer`
   — SITE slots may render as blocked-out frames first; Manim/Remotion beats
   real; `--review` burn-in. Bear watches pacing before component work.
5. **ExplorerSim build.** Implement the component family (Remotion 4.x, match
   each component's zod schema; render ONLY via
   `runtime/scripts/remotion_scenes.py`, foreground, `--concurrency=1`).
   Verify every scene by LOOKING at frames + `qc-sheet.png`.
6. **Review cut → gates.** VISUAL QC LAW pass, TYPECHECK.md (kerning gate, no
   FAIL), FACTCHECK.md updated to all-CONFIRMED or beats cut.
   `./brutalist-art/art final` for the clean master.
7. **Stage, never publish.** `post` skill → TOPOST staging (hi-res master +
   `<slug>.md` description + SRT from measured beat windows). Upload only
   ever from `books/youtube/TOPOST/` per the hard global rule; public is
   Bear's manual Studio flip. After the video is live, paste its YouTube ID
   into `EXPLORER_VIDEO_ID` at the top of `Irreducibly-Human/app/page.tsx`
   (the front-page embed section is already wired), commit, push.

Log every decision and every piece of Bear's feedback in BUILD-LOG.md as you
go. Teardown voice throughout. Fact-check anything you add. Never reach
outside `brutalist-art/` for toolkit code; reel media lives in the reel
folder. If something the plan needs is missing, write `MISSING:` and stop
that thread — do not improvise around a gate.
