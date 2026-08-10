# Data Import Scripts

Command-line tooling for loading and maintaining the **BLS employment** and **O\*NET** data that powers the Occupation Explorer (`/onet`) and related features. These scripts are **not part of the Next.js build** — they never ship to the browser or run on Vercel. They are developer tooling, run manually from a terminal against the Neon database.

> **Data flows one way:** these scripts write to the shared Neon Postgres database. The website only *reads* from it (via `app/api/onet/*`).

---

## Prerequisites

1. **Node** (the version the project already uses) and the project dependencies installed:
   ```
   npm install
   ```
   The Excel importers require `exceljs` (already in `package.json`).

2. **Environment variables** in `.env.local` (never commit this file):

   | Variable | Used by | What it is |
   |----------|---------|------------|
   | `DATABASE_URL` | all scripts | Neon Postgres connection string |
   | `BLS_DIR` | `import-bls.mjs` | local folder of BLS OEWS `.xlsx` files |
   | `ONET_DIR` | `import-onet.mjs` | local folder of the O\*NET database `.xlsx` files |

3. **Source data files** (the `.xlsx` inputs) are **not** in the repo — point `BLS_DIR` / `ONET_DIR` at wherever you downloaded them.

**Two ways scripts load env**, depending on file type:
- `.mjs` scripts → run with Node's `--env-file`: `node --env-file=.env.local scripts/<name>.mjs`
- `.ts` scripts → run with `tsx` (they self-load `.env.local`): `npx tsx scripts/<name>.ts`

Most `.mjs` scripts support **`--dry-run`** — a full preview with **no database writes**. Always dry-run first.

---

## The scripts

### `load_data.mjs` — pipeline orchestrator (start here)
Runs the whole load end-to-end as child processes, stopping on the first failure. This is the one-command entry point; the individual stage scripts below can also be run on their own.

- Stages, in order: **[1]** BLS import → **[2]** O\*NET import → **[3]** statistics → **[4]** alerts.
- `--dry-run` propagates to every stage.
```
node --env-file=.env.local scripts/load_data.mjs --dry-run   # preview
node --env-file=.env.local scripts/load_data.mjs             # real load
```

### `import-bls.mjs` — BLS employment import
Imports BLS OEWS national employment data (1999–2024) into `bls_employment`. Handles the many BLS file-format eras (header positions, SOC-code vintages, group columns) automatically.

- **Upsert only** (`ON CONFLICT DO UPDATE`); never drops/truncates/deletes. Safe to re-run.
- Skips pre-SOC years (1997–1998); 2009 file is a known gap; uses the May survey where a year has two.
- Needs `BLS_DIR` + `DATABASE_URL`.
```
node --env-file=.env.local scripts/import-bls.mjs --dry-run
node --env-file=.env.local scripts/import-bls.mjs
```

### `import-onet.mjs` — O\*NET import
Imports the O\*NET database `.xlsx` files into the 13 `onet_*` tables (occupations, abilities, skills, knowledge, interests, work styles, tasks, related occupations, alternate titles, etc.), using a streaming Excel reader for the large files.

- `onet_occupations` is imported first (every child table has a foreign key to it).
- Keeps `soc_code` as the full O\*NET-SOC code everywhere; `soc_code_bls` (suffix stripped) bridges to `bls_employment`.
- **Upsert only**; never drops/truncates/deletes. Safe to re-run.
- Needs `ONET_DIR` + `DATABASE_URL`.
```
node --env-file=.env.local scripts/import-onet.mjs --dry-run
node --env-file=.env.local scripts/import-onet.mjs
```

### `compute-onet-stats.mjs` — derived ability/skill statistics
Computes `onet_ability_stats` and `onet_skill_stats` from the imported abilities/skills — the workforce averages and confidence intervals the charts show (overall, by major group, by job zone). Pure SQL aggregation.

- **Run after `import-onet.mjs`** (needs the source tables populated).
- **TRUNCATEs and rebuilds** the two stats tables — this is the *only* sanctioned truncate in the pipeline, because these are derived tables.
- Needs `DATABASE_URL`.
```
node --env-file=.env.local scripts/compute-onet-stats.mjs --dry-run
node --env-file=.env.local scripts/compute-onet-stats.mjs
```

### `seed-ai-milestones.mjs` — AI milestone markers
Seeds the `ai_milestones` table (the labels shown below Chart 1's axis — Transformer, GPT-3, ChatGPT, Claude releases, etc.).

- Idempotent: inserts a milestone only if its `label` isn't already present. No truncate/delete.
- Needs `DATABASE_URL`.
```
node --env-file=.env.local scripts/seed-ai-milestones.mjs
```

### `run-alerts.mjs` — post-import integrity checks (read-only)
Runs after the imports to flag data problems. **Queries only — never writes.**

- Alert 1 — new SOC codes appearing only in the latest year.
- Alert 2 — crosswalk integrity (key demo codes must have their expected year rows).
- Alert 3 — cross-dataset orphans (recent BLS codes with no O\*NET match).
- Needs `DATABASE_URL`.
```
node --env-file=.env.local scripts/run-alerts.mjs
```

### `db-query.ts` — ad-hoc SQL runner
A convenience tool to run arbitrary SQL against Neon from the terminal (inspection, one-off fixes, running a `.sql` file). Self-loads `.env.local`.

- Needs `DATABASE_URL`.
```
npx tsx scripts/db-query.ts "SELECT count(*) FROM bls_employment"
npx tsx scripts/db-query.ts --file db/schema.sql
```
> This one can run any SQL you give it, including writes/deletes — use with care.

---

## Typical full refresh

```
# 1. preview everything (no writes)
node --env-file=.env.local scripts/load_data.mjs --dry-run

# 2. run the load for real (BLS → O*NET → stats → alerts)
node --env-file=.env.local scripts/load_data.mjs

# 3. (once, or when milestones change) seed the AI milestones
node --env-file=.env.local scripts/seed-ai-milestones.mjs
```

## Safety summary

- The importers are **upsert-only** and safe to re-run; `compute-onet-stats.mjs` rebuilds only its two derived tables; `run-alerts.mjs` is read-only.
- Always **`--dry-run` first**.
- The database is **shared/production-sensitive** — never point these at it casually, and keep `DATABASE_URL` in `.env.local` (gitignored), never in the repo.
