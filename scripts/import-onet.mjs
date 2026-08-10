/**
 * import-onet.mjs
 * Imports the O*NET database (.xlsx) into the 13 onet_* tables.
 *
 * RUN (preview, no DB writes):  node --env-file=.env.local scripts/import-onet.mjs --dry-run
 * RUN (real import):            node --env-file=.env.local scripts/import-onet.mjs
 *
 * SAFE: upsert only (ON CONFLICT DO UPDATE). NEVER DROP/TRUNCATE/DELETE.
 *
 * KEY RULES (all confirmed via read-only gate checks):
 *   - soc_code = full O*NET-SOC code (e.g. 15-1252.00) in EVERY table (FK target).
 *   - soc_code_bls = suffix stripped (15-1252), only in onet_occupations (bridge to bls_employment).
 *   - onet_occupations is imported FIRST (every child table FKs to it).
 *   - category/subcategory derived from element_id prefix via Content Model Reference.xlsx.
 *   - onet_work_context: CX scale ONLY (its unique key can't hold the multi-row CXP scale).
 *   - not_relevant: Y->TRUE, N->FALSE, n/a/blank->NULL.
 *   - Large files read with ExcelJS streaming reader.
 */
import { join } from 'path';
import ExcelJS from 'exceljs';
import { neon } from '@neondatabase/serverless';

const DRY_RUN = process.argv.includes('--dry-run');
const ONET_DIR = process.env.ONET_DIR;
const DATABASE_URL = process.env.DATABASE_URL;
if (!ONET_DIR) { console.error('ERROR: ONET_DIR not set.'); process.exit(1); }
if (!DATABASE_URL && !DRY_RUN) { console.error('ERROR: DATABASE_URL not set.'); process.exit(1); }
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

// ---------------------------------------------------------------------------
// VALUE HELPERS
// ---------------------------------------------------------------------------
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
const txt = (v) => cellText(v).trim();
function num(v) { const s = txt(v); if (s === '' || s.toLowerCase() === 'n/a') return null; const n = Number(s.replace(/,/g, '')); return Number.isNaN(n) ? null : n; }
function int(v) { const n = num(v); return n === null ? null : Math.round(n); }
function yn(v) { const s = txt(v).toLowerCase(); if (s === 'y') return true; if (s === 'n') return false; return null; } // n/a, blank -> null
function ynFalse(v) { return txt(v).toLowerCase() === 'y'; } // Y -> true; N/n/a/blank -> false (for NOT NULL boolean columns)
const blsCode = (soc) => soc.replace(/\.\d{2}$/, '');

// 23 SOC major groups (2-digit prefix -> name)
const MAJOR_GROUPS = {
  '11': 'Management Occupations', '13': 'Business and Financial Operations Occupations',
  '15': 'Computer and Mathematical Occupations', '17': 'Architecture and Engineering Occupations',
  '19': 'Life, Physical, and Social Science Occupations', '21': 'Community and Social Service Occupations',
  '23': 'Legal Occupations', '25': 'Educational Instruction and Library Occupations',
  '27': 'Arts, Design, Entertainment, Sports, and Media Occupations', '29': 'Healthcare Practitioners and Technical Occupations',
  '31': 'Healthcare Support Occupations', '33': 'Protective Service Occupations',
  '35': 'Food Preparation and Serving Related Occupations', '37': 'Building and Grounds Cleaning and Maintenance Occupations',
  '39': 'Personal Care and Service Occupations', '41': 'Sales and Related Occupations',
  '43': 'Office and Administrative Support Occupations', '45': 'Farming, Fishing, and Forestry Occupations',
  '47': 'Construction and Extraction Occupations', '49': 'Installation, Maintenance, and Repair Occupations',
  '51': 'Production Occupations', '53': 'Transportation and Material Moving Occupations',
  '55': 'Military Specific Occupations',
};

// ---------------------------------------------------------------------------
// STREAMING ROW READER  (yields {headerName: trimmedText})
// ---------------------------------------------------------------------------
async function* rows(file) {
  const path = join(ONET_DIR, file);
  const wbr = new ExcelJS.stream.xlsx.WorkbookReader(path, { sharedStrings: 'cache', worksheets: 'emit', styles: 'ignore', hyperlinks: 'ignore' });
  let header = null;
  for await (const ws of wbr) {
    for await (const row of ws) {
      const vals = row.values; // 1-indexed sparse array
      if (!header) {
        header = {};
        for (let i = 1; i < vals.length; i++) { const h = cellText(vals[i]).trim(); if (h) header[h] = i; }
        continue;
      }
      const obj = {};
      for (const name in header) obj[name] = cellText(vals[header[name]]).trim();
      yield obj;
    }
    break; // first worksheet only
  }
}

// ---------------------------------------------------------------------------
// CATEGORY / SUBCATEGORY DERIVATION (Content Model)
// ---------------------------------------------------------------------------
let CM = {}; // element_id -> element_name
const ABIL_CAT = { '1.A.1': 'cognitive', '1.A.2': 'psychomotor', '1.A.3': 'physical', '1.A.4': 'sensory' };
const SKILL_B_CAT = { '2.B.1': 'social', '2.B.2': 'complex', '2.B.3': 'technical', '2.B.4': 'systems', '2.B.5': 'resource' };
const sub = (segs, n) => CM[segs.slice(0, n).join('.')] ?? null; // Content Model name one level below category

function deriveAbility(id) { const s = id.split('.'); return { category: ABIL_CAT[s.slice(0, 3).join('.')] ?? null, subcategory: sub(s, 4) }; }
function deriveSkill(id) {
  const s = id.split('.');
  if (s[1] === 'A') return { category: 'basic', subcategory: sub(s, 3) };       // 2.A.x
  return { category: SKILL_B_CAT[s.slice(0, 3).join('.')] ?? null, subcategory: sub(s, 4) }; // 2.B.N.x
}
function deriveKnowledge(id) { const s = id.split('.'); return { category: CM[s.slice(0, 3).join('.')] ?? null, subcategory: sub(s, 4) }; } // 2.C.N
function deriveWorkActivity(id) { const s = id.split('.'); return { category: CM[s.slice(0, 3).join('.')] ?? null, subcategory: sub(s, 4) }; } // 4.A.N

// ---------------------------------------------------------------------------
// DEDUPE + UPSERT
// ---------------------------------------------------------------------------
function dedupe(recs, keyIdxs) {
  const m = new Map();
  for (const r of recs) m.set(keyIdxs.map((i) => r[i]).join(''), r);
  return [...m.values()];
}

async function upsert(table, columns, conflictCols, recs) {
  const keyIdxs = conflictCols.map((c) => columns.indexOf(c));
  const rows = dedupe(recs, keyIdxs);
  if (DRY_RUN || rows.length === 0) return rows.length;
  const updateCols = columns.filter((c) => !conflictCols.includes(c));
  const perRow = columns.length;
  const batchSize = Math.max(1, Math.min(1000, Math.floor(60000 / perRow)));
  const setClause = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const ph = batch.map((_, r) => '(' + columns.map((_, c) => '$' + (r * perRow + c + 1)).join(',') + ')').join(',');
    await sql.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${ph} ON CONFLICT (${conflictCols.join(',')}) DO UPDATE SET ${setClause}`, batch.flat());
  }
  return rows.length;
}

// ---------------------------------------------------------------------------
// COLUMN SETS
// ---------------------------------------------------------------------------
const RATING_COLS = ['soc_code', 'element_id', 'element_name', 'category', 'subcategory', 'scale_id', 'data_value', 'n', 'standard_error', 'lower_ci', 'upper_ci', 'recommend_suppress', 'not_relevant', 'date_updated', 'domain_source'];
const REDUCED_COLS = ['soc_code', 'element_id', 'element_name', 'scale_id', 'data_value', 'date_updated', 'domain_source'];
const RATING_KEY = ['soc_code', 'element_id', 'scale_id'];

function ratingRow(r, deriver) {
  const { category, subcategory } = deriver(r['Element ID']);
  return [
    r['O*NET-SOC Code'], r['Element ID'], r['Element Name'], category, subcategory, r['Scale ID'],
    num(r['Data Value']), int(r['N']), num(r['Standard Error']), num(r['Lower CI Bound']), num(r['Upper CI Bound']),
    ynFalse(r['Recommend Suppress']), yn(r['Not Relevant']), r['Date'] || null, r['Domain Source'] || null,
  ];
}

// ---------------------------------------------------------------------------
// PER-TABLE IMPORTS
// ---------------------------------------------------------------------------
async function importOccupations() {
  const jobZones = {};
  for await (const r of rows('Job Zones.xlsx')) jobZones[r['O*NET-SOC Code']] = int(r['Job Zone']);
  const recs = [];
  let jzNull = 0;
  for await (const r of rows('Occupation Data.xlsx')) {
    const soc = r['O*NET-SOC Code']; const bls = blsCode(soc); const mg = bls.slice(0, 2);
    const jz = jobZones[soc] ?? null; if (jz === null) jzNull++;
    recs.push([soc, bls, r['Title'], r['Description'], jz, `${mg}-0000`, MAJOR_GROUPS[mg] ?? null]);
  }
  const n = await upsert('onet_occupations', ['soc_code', 'soc_code_bls', 'title', 'description', 'job_zone', 'major_group_code', 'major_group_name'], ['soc_code'], recs);
  console.log(`  onet_occupations: ${n} rows (${jzNull} with NULL job_zone)`);
  return n;
}

async function importRating(file, table, deriver) {
  const recs = []; let catNull = 0, subNull = 0;
  for await (const r of rows(file)) {
    const row = ratingRow(r, deriver);
    if (row[3] == null) catNull++; if (row[4] == null) subNull++;
    recs.push(row);
  }
  const n = await upsert(table, RATING_COLS, RATING_KEY, recs);
  const warn = (catNull || subNull) ? `  ⚠️ NULLs -> category:${catNull} subcategory:${subNull}` : '';
  console.log(`  ${table}: ${n} rows${warn}`);
  return n;
}

async function importWorkContext() {
  const COLS = ['soc_code', 'element_id', 'element_name', 'scale_id', 'category', 'data_value', 'n', 'standard_error', 'lower_ci', 'upper_ci', 'recommend_suppress', 'not_relevant', 'date_updated', 'domain_source'];
  const recs = []; let total = 0;
  for await (const r of rows('Work Context.xlsx')) {
    total++;
    if (r['Scale ID'] !== 'CX') continue; // CX scale only (unique-key constraint)
    recs.push([
      r['O*NET-SOC Code'], r['Element ID'], r['Element Name'], r['Scale ID'], r['Category'] || null,
      num(r['Data Value']), int(r['N']), num(r['Standard Error']), num(r['Lower CI Bound']), num(r['Upper CI Bound']),
      ynFalse(r['Recommend Suppress']), yn(r['Not Relevant']), r['Date'] || null, r['Domain Source'] || null,
    ]);
  }
  const n = await upsert('onet_work_context', COLS, RATING_KEY, recs);
  console.log(`  onet_work_context: ${n} rows (CX only, from ${total} total)`);
  return n;
}

async function importReduced(file, table) {
  const recs = [];
  for await (const r of rows(file)) {
    recs.push([r['O*NET-SOC Code'], r['Element ID'], r['Element Name'], r['Scale ID'], num(r['Data Value']), r['Date'] || null, r['Domain Source'] || null]);
  }
  const n = await upsert(table, REDUCED_COLS, RATING_KEY, recs);
  console.log(`  ${table}: ${n} rows`);
  return n;
}

async function importTasks() {
  const recs = [];
  for await (const r of rows('Task Statements.xlsx')) {
    recs.push([r['O*NET-SOC Code'], r['Task ID'], r['Task'], r['Task Type'] || null, int(r['Incumbents Responding']), r['Date'] || null, r['Domain Source'] || null]);
  }
  const n = await upsert('onet_tasks', ['soc_code', 'task_id', 'task_text', 'task_type', 'incumbents_responding', 'date_updated', 'domain_source'], ['soc_code', 'task_id'], recs);
  console.log(`  onet_tasks: ${n} rows`);
  return n;
}

async function importTechSkills() {
  const recs = [];
  for await (const r of rows('Technology Skills.xlsx')) {
    recs.push([r['O*NET-SOC Code'], r['Example'], r['Commodity Code'] || null, r['Commodity Title'] || null, ynFalse(r['Hot Technology']), ynFalse(r['In Demand'])]);
  }
  const n = await upsert('onet_technology_skills', ['soc_code', 'example', 'commodity_code', 'commodity_title', 'hot_technology', 'in_demand'], ['soc_code', 'example'], recs);
  console.log(`  onet_technology_skills: ${n} rows`);
  return n;
}

async function importAlternateTitles() {
  const recs = [];
  for await (const r of rows('Alternate Titles.xlsx')) {
    recs.push([r['O*NET-SOC Code'], r['Alternate Title'], r['Short Title'] || null]);
  }
  const n = await upsert('onet_alternate_titles', ['soc_code', 'alternate_title', 'short_title'], ['soc_code', 'alternate_title'], recs);
  console.log(`  onet_alternate_titles: ${n} rows`);
  return n;
}

async function importRelated() {
  const recs = [];
  for await (const r of rows('Related Occupations.xlsx')) {
    recs.push([r['O*NET-SOC Code'], r['Related O*NET-SOC Code'], r['Relatedness Tier'] || null, num(r['Index'])]);
  }
  const n = await upsert('onet_related_occupations', ['soc_code', 'related_soc_code', 'relatedness_tier', 'rank_index'], ['soc_code', 'related_soc_code'], recs);
  console.log(`  onet_related_occupations: ${n} rows`);
  return n;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  console.log(`=== O*NET Import ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
  console.log(`ONET_DIR: ${ONET_DIR}`);

  console.log('\nLoading Content Model Reference...');
  for await (const r of rows('Content Model Reference.xlsx')) CM[r['Element ID']] = r['Element Name'];
  console.log(`  ${Object.keys(CM).length} content-model elements loaded`);

  let total = 0;
  console.log('\n[occupations first — FK parent]');
  total += await importOccupations();

  console.log('\n[rating tables with category/subcategory]');
  total += await importRating('Abilities.xlsx', 'onet_abilities', deriveAbility);
  total += await importRating('Skills.xlsx', 'onet_skills', deriveSkill);
  total += await importRating('Knowledge.xlsx', 'onet_knowledge', deriveKnowledge);
  total += await importRating('Work Activities.xlsx', 'onet_work_activities', deriveWorkActivity);

  console.log('\n[work context — CX only]');
  total += await importWorkContext();

  console.log('\n[reduced rating tables]');
  total += await importReduced('Interests.xlsx', 'onet_interests');
  total += await importReduced('Work Styles.xlsx', 'onet_work_styles');
  total += await importReduced('Work Values.xlsx', 'onet_work_values');

  console.log('\n[other tables]');
  total += await importTasks();
  total += await importTechSkills();
  total += await importAlternateTitles();
  total += await importRelated();

  console.log(`\n${DRY_RUN ? 'DRY RUN complete — no rows written.' : 'Done.'} Total rows ${DRY_RUN ? 'to upsert' : 'upserted'}: ${total}`);
  if (DRY_RUN) console.log('Re-run without --dry-run to write to the database.');
}

main().catch((err) => { console.error('\nFATAL ERROR:', err.message); process.exit(1); });
