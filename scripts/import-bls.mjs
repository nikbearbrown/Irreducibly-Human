/**
 * import-bls.mjs
 * Imports BLS OEWS national employment data (1999-2024) into bls_employment.
 *
 * BEFORE RUNNING:
 *   npm install exceljs
 *   .env.local must contain DATABASE_URL and BLS_DIR.
 *
 * RUN (preview, no DB writes):  node --env-file=.env.local scripts/import-bls.mjs --dry-run
 * RUN (real import):            node --env-file=.env.local scripts/import-bls.mjs
 *
 * SAFE TO RE-RUN: upsert only (ON CONFLICT DO UPDATE). NEVER DROP/TRUNCATE/DELETE.
 *
 * HANDLES MULTIPLE BLS ERAS (verified by audit):
 *   1999-2000: ~37-row preamble + rich-text cells; header found by scanning for OCC_CODE;
 *              2000 SOC codes; group col "GROUP" (detail rows blank).
 *   2001-2008: header row 1; 2000 SOC; group col "GROUP" (detail rows blank).
 *   2010-2011: header row 1; 2010 SOC; group col "GROUP".
 *   2012-2018: header row 1; 2010 SOC; group col "OCC_GROUP".
 *   2019:      header row 1, lowercase headers; 2018 SOC; group col "O_GROUP"; has AREA_TYPE.
 *   2020-2024: header row 1; 2018 SOC; group col "O_GROUP"; has AREA_TYPE; OCC_CODE not in col 1.
 *   1997-1998 (pre-SOC OES) are intentionally SKIPPED. 2009 file is missing (gap).
 *   2003 & 2004 have May + November surveys; we use MAY only.
 */

import { readdirSync } from 'fs';
import { join } from 'path';
import ExcelJS from 'exceljs';
import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');
const BLS_DIR = process.env.BLS_DIR;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BLS_DIR) { console.error('ERROR: BLS_DIR is not set.'); process.exit(1); }
if (!DATABASE_URL && !DRY_RUN) { console.error('ERROR: DATABASE_URL is not set.'); process.exit(1); }

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

const START_YEAR = 1999; // 1997-1998 use pre-SOC OES codes and are skipped.

// ---------------------------------------------------------------------------
// SOC CROSSWALK  (applied only for year <= 2018; old codes never appear after)
//   2000 SOC: 15-1021 -> 15-1251; 15-1031 + 15-1032 -> 15-1252 (summed)
//   2010 SOC: 15-1131 -> 15-1251; 15-1132 + 15-1133 -> 15-1252 (summed)
// Summing implements Prof. Brown's "Option C".
// ---------------------------------------------------------------------------

const SOC_CROSSWALK = {
  '15-1021': '15-1251',
  '15-1031': '15-1252',
  '15-1032': '15-1252',
  '15-1131': '15-1251',
  '15-1132': '15-1252',
  '15-1133': '15-1252',
};

const CANONICAL_TITLES = {
  '15-1251': 'Computer Programmers',
  '15-1252': 'Software Developers',
};

// Group labels that are NOT detailed occupations (summary roll-ups).
const SUMMARY_GROUPS = new Set(['total', 'major', 'maj', 'minor', 'broad']);

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Extract plain text from any cell value (handles rich-text / formula objects). */
function cellText(v) {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    if (v.text != null) return String(v.text);
    if (v.result != null) return String(v.result);
    return '';
  }
  return String(v);
}

const yearOf = (f) => { const m = f.match(/(19|20)\d{2}/); return m ? parseInt(m[0], 10) : null; };
const panelOf = (f) => (/november/i.test(f) ? 'november' : /may/i.test(f) ? 'may' : '');

function parseEmployment(raw) {
  const s = cellText(raw).trim();
  if (s === '' || s === '**') return { employment: null, is_suppressed: true };
  const cleaned = s.replace(/,/g, '');
  if (!/^\d+$/.test(cleaned)) return { employment: null, is_suppressed: true };
  return { employment: parseInt(cleaned, 10), is_suppressed: false };
}

function normalizeSocCode(code, year) {
  if (year <= 2018 && SOC_CROSSWALK[code]) return SOC_CROSSWALK[code];
  return code;
}

/** Merge rows sharing (soc_code, year) after crosswalk; sum employment (Option C). */
function aggregateRecords(records) {
  const map = new Map();
  for (const r of records) {
    const key = `${r.soc_code}|${r.year}`;
    if (!map.has(key)) { map.set(key, { ...r }); continue; }
    const existing = map.get(key);
    if (r.employment !== null) {
      existing.employment = (existing.employment ?? 0) + r.employment;
      existing.is_suppressed = false;
    }
  }
  return [...map.values()];
}

// ---------------------------------------------------------------------------
// FIND BLS FILES  (1999-2024, May-only for 2003/04, skip non-year files)
// ---------------------------------------------------------------------------

function getBLSFiles() {
  let files;
  try { files = readdirSync(BLS_DIR); }
  catch (err) { console.error(`ERROR: cannot read BLS_DIR "${BLS_DIR}": ${err.message}`); process.exit(1); }

  const picked = files
    .filter((f) => /^national_.*\.xlsx$/i.test(f))
    .map((f) => ({ filename: f, path: join(BLS_DIR, f), year: yearOf(f), panel: panelOf(f) }))
    .filter((x) => x.year !== null && x.year >= START_YEAR)
    .filter((x) => !([2003, 2004].includes(x.year) && x.panel === 'november')) // May only
    .sort((a, b) => a.year - b.year);

  if (picked.length === 0) { console.error(`ERROR: no BLS files >= ${START_YEAR} in "${BLS_DIR}"`); process.exit(1); }

  // Loudly report duplicate years (would indicate an unfiltered second panel).
  const seen = new Set();
  for (const p of picked) {
    if (seen.has(p.year)) console.warn(`  WARNING: duplicate file for year ${p.year}: ${p.filename}`);
    seen.add(p.year);
  }
  return picked;
}

/** Find the header row: the first row (within 60) that contains an OCC_CODE cell. */
function findHeaderRow(sheet) {
  for (let r = 1; r <= Math.min(sheet.rowCount, 60); r++) {
    let hit = false;
    sheet.getRow(r).eachCell((c) => { if (cellText(c.value).trim().toLowerCase() === 'occ_code') hit = true; });
    if (hit) return r;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// PROCESS A SINGLE FILE
// ---------------------------------------------------------------------------

async function processFile(fileInfo) {
  const { filename, path, year } = fileInfo;
  console.log(`\nReading ${filename} (year: ${year})...`);

  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.readFile(path); }
  catch (err) { console.error(`  ERROR: could not read file: ${err.message}`); return []; }

  const sheet = workbook.worksheets[0];
  if (!sheet) { console.error(`  ERROR: no worksheet in ${filename}`); return []; }

  const headerRow = findHeaderRow(sheet);
  if (headerRow < 0) { console.error(`  ERROR: OCC_CODE header not found in ${filename} — SKIPPED`); return []; }

  // Build header map (UPPERCASE) from the detected header row.
  const headers = [];
  sheet.getRow(headerRow).eachCell((cell, col) => { headers[col] = cellText(cell.value).trim().toUpperCase(); });

  const codeKey = headers.find((h) => h === 'OCC_CODE');
  const groupKey = headers.find((h) => h === 'O_GROUP' || h === 'OCC_GROUP' || h === 'GROUP');
  const empKey = headers.find((h) => h === 'TOT_EMP');
  // Title: prefer exact OCC_TITLE, then truncated OCC_TITL, then any OCC*TITL (avoid AREA_TITLE).
  const titleKey = headers.find((h) => h === 'OCC_TITLE')
    || headers.find((h) => h === 'OCC_TITL')
    || headers.find((h) => /OCC.*TITL/.test(h));
  if (!codeKey || !groupKey || !empKey) {
    console.error(`  ERROR: missing column(s) in ${filename} (code:${codeKey} group:${groupKey} emp:${empKey}) — SKIPPED`);
    return [];
  }

  const hasAreaType = headers.includes('AREA_TYPE'); // only enforce national filter when present

  const records = [];
  let detailed = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow) return;

    const rowData = {};
    row.eachCell((cell, col) => { const h = headers[col]; if (h) rowData[h] = cellText(cell.value); });

    const code = String(rowData[codeKey] ?? '').trim();
    if (!code) return;
    if (/-0000$/.test(code)) return;                              // drop total/major aggregates (e.g. blank-group 00-0000)

    const group = String(rowData[groupKey] ?? '').trim().toLowerCase();
    if (SUMMARY_GROUPS.has(group)) return;                        // drop labeled summary rows

    if (hasAreaType && String(rowData['AREA_TYPE'] ?? '').trim() !== '1') return; // national only

    detailed++;

    const socCode = normalizeSocCode(code, year);
    const { employment, is_suppressed } = parseEmployment(rowData[empKey]);

    records.push({
      soc_code: socCode,
      year,
      employment,
      is_suppressed,
      is_projected: false,
      occ_title: CANONICAL_TITLES[socCode] ?? (titleKey ? String(rowData[titleKey] ?? '').trim() : ''),
      occ_group: group || 'detailed',
      source: `OEWS_${year}`,
    });
  });

  const merged = aggregateRecords(records);
  const collapsed = records.length - merged.length;
  console.log(`  Detailed rows: ${detailed}${collapsed > 0 ? `  (summed ${collapsed} crosswalked row(s))` : ''}${hasAreaType ? '' : '  [no AREA_TYPE column]'}`);
  return merged;
}

// ---------------------------------------------------------------------------
// INSERT
// ---------------------------------------------------------------------------

async function insertBatch(records) {
  if (records.length === 0) return 0;
  if (DRY_RUN) return records.length;

  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r, idx) => {
      const b = idx * 8;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8})`;
    }).join(', ');
    const params = batch.flatMap((r) => [
      r.soc_code, r.year, r.employment, r.is_suppressed, r.is_projected, r.occ_title, r.occ_group, r.source,
    ]);
    await sql.query(`
      INSERT INTO bls_employment
        (soc_code, year, employment, is_suppressed, is_projected, occ_title, occ_group, source)
      VALUES ${values}
      ON CONFLICT (soc_code, year) DO UPDATE SET
        employment    = EXCLUDED.employment,
        is_suppressed = EXCLUDED.is_suppressed,
        is_projected  = EXCLUDED.is_projected,
        occ_title     = EXCLUDED.occ_title,
        occ_group     = EXCLUDED.occ_group,
        source        = EXCLUDED.source
    `, params);
    inserted += batch.length;
  }
  return inserted;
}

// ---------------------------------------------------------------------------
// EMPLOYMENT INDEX (2018 = 100)
// ---------------------------------------------------------------------------

async function computeEmploymentIndex() {
  console.log('\nComputing employment index (2018 = 100)...');
  const result = await sql.query(`
    WITH baseline AS (
      SELECT soc_code, employment AS emp_2018
      FROM bls_employment
      WHERE year = 2018 AND is_suppressed = FALSE AND employment IS NOT NULL
    )
    UPDATE bls_employment b
    SET employment_index = ROUND((b.employment::NUMERIC / base.emp_2018) * 100, 2)
    FROM baseline base
    WHERE b.soc_code = base.soc_code AND b.is_suppressed = FALSE AND b.employment IS NOT NULL
    RETURNING b.soc_code
  `);
  console.log(`  Updated ${result.length} rows with employment_index`);
  const skipped = await sql.query(`SELECT COUNT(*) AS n FROM bls_employment WHERE employment_index IS NULL`);
  console.log(`  ${skipped[0].n} rows have NULL index (no 2018 baseline / suppressed / NULL employment)`);
}

// ---------------------------------------------------------------------------
// PLAUSIBILITY CHECK (live table)
// ---------------------------------------------------------------------------

async function plausibilityCheck() {
  console.log('\nPlausibility check...');
  const rows = await sql.query(`
    SELECT soc_code, year, employment, employment_index
    FROM bls_employment
    WHERE soc_code IN ('15-1251', '15-1252') AND year IN (1999, 2018, 2024)
    ORDER BY soc_code, year
  `);
  for (const r of rows) {
    console.log(`  ${r.soc_code} | ${r.year} | emp=${r.employment ?? 'NULL'} | index=${r.employment_index ?? 'NULL'}`);
  }
  const dev2024 = rows.find((r) => r.soc_code === '15-1252' && r.year === 2024);
  const prog2024 = rows.find((r) => r.soc_code === '15-1251' && r.year === 2024);
  if (prog2024?.employment_index != null) {
    const i = parseFloat(prog2024.employment_index);
    console.log((i < 30 || i > 70) ? `  WARNING: Programmers 2024 index ${i} (expected ~48)` : `  OK: Programmers 2024 index ${i} (~48)`);
  }
  if (dev2024?.employment_index != null) {
    const i = parseFloat(dev2024.employment_index);
    console.log((i < 100 || i > 160) ? `  WARNING: Developers 2024 index ${i} (expected ~126)` : `  OK: Developers 2024 index ${i} (~126)`);
  }
}

// ---------------------------------------------------------------------------
// DRY-RUN REPORT (in-memory)
// ---------------------------------------------------------------------------

function dryRunReport(allRecords) {
  console.log('\n[DRY RUN] No rows written.');
  const byYear = {};
  for (const r of allRecords) byYear[r.year] = (byYear[r.year] ?? 0) + 1;
  console.log('\n[DRY RUN] Rows per year:');
  for (const y of Object.keys(byYear).sort()) console.log(`  ${y}: ${byYear[y]}`);

  const codes = ['15-1251', '15-1252'];
  const baseline = {};
  for (const r of allRecords) if (r.year === 2018 && codes.includes(r.soc_code)) baseline[r.soc_code] = r.employment;

  for (const code of codes) {
    console.log(`\n[DRY RUN] ${code} ${CANONICAL_TITLES[code]} — 2018 baseline = ${baseline[code] ?? 'MISSING'}`);
    const series = allRecords.filter((r) => r.soc_code === code).sort((a, b) => a.year - b.year);
    for (const r of series) {
      const idx = (baseline[code] && r.employment != null) ? ((r.employment / baseline[code]) * 100).toFixed(1) : 'n/a';
      console.log(`     ${r.year}: emp=${r.employment ?? 'NULL'}  index=${idx}`);
    }
  }
  console.log('\n[DRY RUN] Expected: Programmers 2024 ~48, Developers 2024 ~126.');
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log(`=== BLS OEWS Import ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
  console.log(`BLS_DIR: ${BLS_DIR}`);

  const files = getBLSFiles();
  console.log(`Found ${files.length} files for years: ${files.map((f) => f.year).join(', ')}`);

  let total = 0;
  const allRecords = [];
  for (const fileInfo of files) {
    const records = await processFile(fileInfo);
    if (DRY_RUN) allRecords.push(...records);
    const n = await insertBatch(records);
    console.log(`  ${DRY_RUN ? 'Would upsert' : 'Inserted/updated'} ${n} rows`);
    total += n;
  }
  console.log(`\nAll files processed. Total rows ${DRY_RUN ? 'to upsert' : 'inserted/updated'}: ${total}`);

  if (DRY_RUN) {
    dryRunReport(allRecords);
    console.log('\nDry run complete. Re-run without --dry-run to write to the database.');
    return;
  }

  await computeEmploymentIndex();
  await plausibilityCheck();
  console.log('\nDone. bls_employment is ready (1999-2024).');
}

main().catch((err) => { console.error('\nFATAL ERROR:', err.message); process.exit(1); });
