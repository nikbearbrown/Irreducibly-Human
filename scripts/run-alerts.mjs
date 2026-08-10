/**
 * run-alerts.mjs  (READ-ONLY — queries only, no writes)
 * Post-import data-integrity alerts. Run after BLS + O*NET imports.
 *
 *   Alert 1 — New SOC codes: codes present only in the most recent year.
 *   Alert 2 — Crosswalk integrity: 15-1251 & 15-1252 must have 2012-2018 rows.
 *   Alert 3 — Cross-dataset orphans: 2024 BLS codes with no O*NET match.
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set.'); process.exit(1); }
const sql = neon(DATABASE_URL);

// Alert 1 — new SOC codes (only in the most recent year, not any prior year)
async function alertNewCodes() {
  const rows = await sql.query(`
    WITH maxyear AS (SELECT MAX(year) AS y FROM bls_employment)
    SELECT b.soc_code, MAX(b.occ_title) AS title
    FROM bls_employment b CROSS JOIN maxyear m
    WHERE b.year = m.y
      AND NOT EXISTS (SELECT 1 FROM bls_employment p WHERE p.soc_code = b.soc_code AND p.year < m.y)
    GROUP BY b.soc_code
    ORDER BY b.soc_code
  `);
  if (rows.length === 0) {
    console.log('INFO: No new SOC codes detected.');
  } else {
    for (const r of rows) {
      console.log(`INFO: New SOC code detected: ${r.soc_code} ${r.title ?? ''} — verify before next run.`);
    }
  }
}

// Alert 2 — crosswalk integrity (Option B: check the crosswalk OUTPUTS)
async function alertCrosswalk() {
  let ok = true;
  for (const code of ['15-1251', '15-1252']) {
    const r = await sql.query(
      `SELECT COUNT(DISTINCT year)::int AS yrs FROM bls_employment WHERE soc_code = $1 AND year BETWEEN 2012 AND 2018`,
      [code]
    );
    if (r[0].yrs < 7) {
      ok = false;
      console.log(`WARNING: Crosswalk output ${code} missing from pre-2019 data.`);
      console.log('The crosswalk in import-bls.mjs may not have applied correctly.');
      console.log('Re-run import-bls.mjs before proceeding.');
    }
  }
  if (ok) console.log('INFO: Crosswalk outputs present for 2012-2018 (15-1251, 15-1252).');
}

// Alert 3 — cross-dataset orphans (2024 only)
async function alertOrphans() {
  const r = await sql.query(`
    SELECT COUNT(*)::int AS n FROM (
      SELECT DISTINCT b.soc_code
      FROM bls_employment b
      WHERE b.year = 2024
        AND NOT EXISTS (SELECT 1 FROM onet_occupations o WHERE o.soc_code_bls = b.soc_code)
    ) t
  `);
  const n = r[0].n;
  console.log(`INFO: ${n} current BLS codes (2024) have no O*NET match.`);
  console.log('Expected range 50 to 150.');
  if (n > 200) {
    console.log(`WARNING: Orphan count ${n} exceeds expected range.`);
    console.log('This may indicate a data import problem or a new SOC revision.');
  }
}

async function main() {
  // Guard: alerts are meaningless on an unpopulated table (e.g. loader dry-run).
  const c = await sql.query(`SELECT COUNT(*)::int AS n FROM bls_employment`);
  if (c[0].n === 0) {
    console.log('INFO: bls_employment is empty — skipping alerts (dry-run or pre-load).');
    return;
  }
  await alertNewCodes();
  await alertCrosswalk();
  await alertOrphans();
}

main().catch((err) => { console.error('\nFATAL ERROR:', err.message); process.exit(1); });
