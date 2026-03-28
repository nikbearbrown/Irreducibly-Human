
# Irreducibly Human: What AI Can and Can't Do

**A curriculum series for the cognitive capacities the AI era most urgently requires humans to develop.**

[irreducibly.xyz](https://www.irreducibly.xyz/)

---

## The argument

Machines are superhuman at pattern recognition, fact retrieval, and syntactic correctness. The curriculum was built — before machines existed — to develop exactly those capacities. That is not a new failure. AI exposed it.

The intelligent response to a forklift is not to practice lifting heavier objects. It is to learn to operate the machine, understand what it can and cannot lift, and develop the judgment to know what needs lifting in the first place.

We are in the early years of the most powerful cognitive forklifts ever built. The curriculum is still teaching students to lift with their backs.

---

## The series

Six courses covering the intelligences AI cannot replicate, organized by a seven-tier taxonomy of human cognition sorted by machine capability.

| Book | Tagline | Tiers |
|------|---------|-------|
| **AI Literacy, Fluency, and Trust** | The entry point. How to operate the cognitive forklift without being replaced by it. | Tier 1 |
| **Causal Reasoning** | What causes what, and why no algorithm can answer that for you. | Tier 5 |
| **AImagineering** | Post-AI design thinking. One week on ideation. The rest on the judgment that makes it matter. | Tiers 3, 4 |
| **Ethical Play** | Build a game that makes a player feel moral weight. Survive the AI audit. Prove the ethics are in the mechanics. | Tier 3 |
| **Conducting AI** | The five supervisory capacities no algorithm possesses. Hear the wrong note. Choose the piece. Direct the sections. | Tier 4 |
| **The Collective** | Intelligence that cannot be possessed. Only accomplished. Together. | Tier 6 |

Plus two companion books: *A Teacher's Guide to AI for Embodied Learning* (Tier 2) and *The AI Sherpa: A Practitioner's Guide for Experiential Learning* (Tier 7).

---

## The taxonomy

The seven tiers organize human intelligence by what machines can and cannot do. This is not an academic classification — it is a triage.

---

**Tier 1 — Pattern & Association** · *AI capability: Superhuman*

Linguistic intelligence, logical-mathematical reasoning, musical pattern recognition, spatial reasoning, naturalistic categorization, encyclopedic recall, and associative lookup. This is where standardized tests live. It is also where machines are now stronger than any human who has ever lived. The correct educational response is not to drill harder — it is to teach students to operate these tools.

---

**Tier 2 — Embodied & Sensorimotor** · *AI capability: Weak / emerging*

The knowledge that lives in the body: proprioception, physical skill, tool use, the auditory and tactile feedback through a tool, the surgeon's hands, the carpenter's feel for grain. Robotics is improving in narrow domains. Machines do not hold the general case. Nobody stopped teaching woodshop because a language model can describe joinery. Addressed through the *Teacher's Guide* companion, not a standalone course.

---

**Tier 3 — Social & Personal** · *AI capability: Simulates — doesn't feel*

Interpersonal intelligence, intrapersonal intelligence, emotional regulation, cultural intelligence, pedagogical intelligence, and moral reasoning under genuine stakes. Machines produce outputs that read as empathetic without experiencing anything. The danger is not that the output is wrong. The danger is that the capacity atrophies in the person who stops exercising it.

---

**Tier 4 — Metacognitive & Supervisory** · *AI capability: Poor*

The intelligences that oversee all the others. Gardner never named these. This is the gap. Plausibility auditing (knowing an answer is wrong before recomputing it). Problem formulation (deciding what is worth solving). Tool orchestration (knowing which tool to use, when, and whether to trust it). Interpretive judgment (what does this result mean in this context). Executive integration. Tier 1 without Tier 4 is a very efficient way to be confidently wrong at scale.

---

**Tier 5 — Causal & Counterfactual** · *AI capability: Weak to absent*

Judea Pearl's ladder of causation has three rungs: observation (what is), intervention (if I do X, what happens?), and counterfactual (what would have happened if I had done X instead). Current AI is superhuman at Rung 1 and nearly absent at Rungs 2 and 3. A system that identifies correlations in data cannot tell you whether your intervention will work. That reasoning must be supplied by a human.

---

**Tier 6 — Collective & Distributed** · *AI capability: Absent by definition*

Intelligence that is not a property of any individual — emergent from systems of people in relationship. The thing that makes science work over centuries. The collaborative friction that refines an idea in ways neither participant could achieve alone. Language models may be a lossy compression of collective human intelligence: they reflect the record, not the practice that generated it. The algorithm has access to the literature. It is absent from the practice by definition.

---

**Tier 7 — Existential & Wisdom** · *AI capability: Absent — no stakes*

Phronesis — Aristotelian practical wisdom — requires knowing when and how to apply what you know, and when not to. It requires stakes, the possibility of loss, a life that can be poorly lived. Narrative identity requires lived time. An algorithm has no stakes. It cannot commit because it cannot lose. This tier is not a course — it is the horizon the series points toward.

---

---

## What has shipped

**Cancer Biology and Therapeutics** — 38-chapter textbook written in approximately one month. In production in an NIH program at Northeastern University.

**The Boyle System** — AI-assisted documentary infrastructure for scientific reproducibility. Piloted across 150+ Humanitarians AI Fellows. Reduced mentor meeting gap-review time from 60% to 20%.

**Causal Reasoning (Course 1)** — Syllabus submitted for course approval at Northeastern MGEN.

---

## The production infrastructure

The series is built with the tools it teaches.

| Tool | What it does |
|------|-------------|
| **Bookie the Bookmaker** | Chapter drafting |
| **Tic TOC** | Textbook architecture — publication-ready TOCs with learning outcomes and prerequisite maps |
| **Popper** | Assertion verification — flags suspect claims for expert review |
| **Figure Architect** | Identifies high-assertion zones; generates figures to reduce assertion density |
| **Zelda** | Game design document consultant — adapted for the Ethical Play workflow |
| **CAZE** | Custom case study generator for any domain |
| **CRITIQ** | Peer review and paper development protocol |
| **SOCRIT** | Socratic prompt evaluation using the Paul-Elder framework |
| **Medhavy** | Adaptive learning platform with multi-armed bandit pedagogy engine (Thompson Sampling) |
| **The Boyle System** | AI-assisted documentary infrastructure for scientific reproducibility |

---

## Built by

**Nik Bear Brown** — Associate Teaching Professor of Computer Science and AI, Northeastern University. Founder, [Humanitarians AI](https://humanitarians.ai) (501(c)(3)).

[Theorist.ai](https://theorist.ai) · [Skepticism.ai](https://www.skepticism.ai/) · [Hypothetical.ai](https://www.hypothetical.ai/) · [irreducibly.xyz](https://www.irreducibly.xyz/)


# Irreducibly Human — What AI Can and Can't Do

A 5-course graduate series at Bear Brown & Company. Each course
develops a specific tier of human intelligence that AI cannot replicate.

**Live site:** https://irreduciblyhuman.xyz
**GitHub:** https://github.com/nikbearbrown/Irreducibly-Human

## Stack

- Next.js (App Router)
- Tailwind CSS + @tailwindcss/typography
- TypeScript
- Neon (serverless PostgreSQL)
- Vercel Blob (image storage)
- Tiptap (rich text editor)
- next-themes (dark/light mode)

## Prerequisites

- Node.js LTS — https://nodejs.org/
- Git — https://git-scm.com/downloads

### macOS
```bash
brew install node git
```

### Ubuntu/Debian
```bash
sudo apt update && sudo apt install nodejs npm git
```

### Windows
Download and run the installers from the links above. Restart after.

### Verify
```bash
node --version && npm --version && git --version
```

## Getting Started

```bash
git clone https://github.com/nikbearbrown/Irreducibly-Human.git
cd Irreducibly-Human
npm install --legacy-peer-deps
cp .env.example .env.local   # add your environment variables
npm run dev
```

Open http://localhost:3000

## Environment Variables

```
DATABASE_URL=              # Neon PostgreSQL connection string
ADMIN_PASSWORD=            # Password for /admin/login
BLOB_READ_WRITE_TOKEN=     # Vercel Blob token
NEXT_PUBLIC_SITE_URL=      # https://irreduciblyhuman.xyz
```

## Database Setup

Run the SQL in `db/schema.sql` in your Neon dashboard, or paste the contents
into the Neon SQL Editor.

## Deployment

Push to `main` → Vercel auto-deploys.

Set all environment variables in Vercel → Project Settings → Environment Variables.

## Admin

Navigate to `/admin` — login with `ADMIN_PASSWORD`. Manage blog posts, tools,
and Substack sections from the dashboard.

## Troubleshooting

- **npm install fails** — try `npm cache clean --force` then re-run with `--legacy-peer-deps`
- **Permission errors on Mac/Linux** — use `sudo` for system-wide installs
- **Network issues** — `npm config set registry https://registry.npmjs.org/`

## About

Created by Nik Bear Brown, Bear Brown & Company.

Irreducibly Human is open source (MIT License). See `LICENSE` for details.

- [bearbrown.co](https://www.bearbrown.co/)
- [The Skepticism AI Substack](https://www.skepticism.ai/)
