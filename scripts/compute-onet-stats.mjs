/**
 * compute-onet-stats.mjs
 * Computes onet_ability_stats (from onet_abilities) and onet_skill_stats
 * (from onet_skills). Pure SQL aggregation — one INSERT...SELECT with GROUP BY
 * per group_type (no JavaScript loops over data).
 *
 * RUN (smoke test, no writes):  node --env-file=.env.local scripts/compute-onet-stats.mjs --dry-run
 * RUN (real):                   node --env-file=.env.local scripts/compute-onet-stats.mjs
 *
 * NOTE: source tables (onet_abilities/onet_skills) must already be populated
 * (i.e. run the O*NET import first). On empty tables this returns 0 rows.
 *
 * group_types per unique (element_id, scale_id):
 *   overall/'all'              — across all occupations
 *   major_group/<code>         — grouped by onet_occupations.major_group_code, count >= 5
 *   job_zone/<1..5>            — grouped by onet_occupations.job_zone, count >= 5
 * Excludes recommend_suppress = TRUE and data_value IS NULL.
 * CI = mean ± 1.96 * STDDEV / SQRT(COUNT).
 *
 * TRUNCATEs both stats tables before recomputing — the ONLY sanctioned TRUNCATE
 * in this build (these are derived tables, safe to rebuild).
 */
import { neon } from '@neondatabase/serverless';

const DRY_RUN = process.argv.includes('--dry-run');
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set.'); process.exit(1); }
const sql = neon(DATABASE_URL);

const STATS_COLS = 'element_id, element_name, scale_id, group_type, group_code, mean_value, ci_lower, ci_upper, occupation_count';

// CI expression reused in every group_type
const AGG = `
  AVG(data_value) AS mean_value,
  AVG(data_value) - 1.96 * STDDEV(data_value) / SQRT(COUNT(*)) AS ci_lower,
  AVG(data_value) + 1.96 * STDDEV(data_value) / SQRT(COUNT(*)) AS ci_upper,
  COUNT(*) AS occupation_count`;

function buildSelect(source, groupType) {
  if (groupType === 'overall') {
    return `
      SELECT element_id, element_name, scale_id, 'overall' AS group_type, 'all' AS group_code,
        AVG(data_value), AVG(data_value) - 1.96*STDDEV(data_value)/SQRT(COUNT(*)),
        AVG(data_value) + 1.96*STDDEV(data_value)/SQRT(COUNT(*)), COUNT(*)
      FROM ${source}
      WHERE recommend_suppress IS NOT TRUE AND data_value IS NOT NULL
      GROUP BY element_id, element_name, scale_id`;
  }
  if (groupType === 'major_group') {
    return `
      SELECT s.element_id, s.element_name, s.scale_id, 'major_group' AS group_type, o.major_group_code AS group_code,
        AVG(s.data_value), AVG(s.data_value) - 1.96*STDDEV(s.data_value)/SQRT(COUNT(*)),
        AVG(s.data_value) + 1.96*STDDEV(s.data_value)/SQRT(COUNT(*)), COUNT(*)
      FROM ${source} s JOIN onet_occupations o ON s.soc_code = o.soc_code
      WHERE s.recommend_suppress IS NOT TRUE AND s.data_value IS NOT NULL AND o.major_group_code IS NOT NULL
      GROUP BY s.element_id, s.element_name, s.scale_id, o.major_group_code
      HAVING COUNT(*) >= 5`;
  }
  // job_zone
  return `
    SELECT s.element_id, s.element_name, s.scale_id, 'job_zone' AS group_type, CAST(o.job_zone AS TEXT) AS group_code,
      AVG(s.data_value), AVG(s.data_value) - 1.96*STDDEV(s.data_value)/SQRT(COUNT(*)),
      AVG(s.data_value) + 1.96*STDDEV(s.data_value)/SQRT(COUNT(*)), COUNT(*)
    FROM ${source} s JOIN onet_occupations o ON s.soc_code = o.soc_code
    WHERE s.recommend_suppress IS NOT TRUE AND s.data_value IS NOT NULL AND o.job_zone IS NOT NULL
    GROUP BY s.element_id, s.element_name, s.scale_id, o.job_zone
    HAVING COUNT(*) >= 5`;
}

const STATS = [
  { source: 'onet_abilities', table: 'onet_ability_stats', label: 'ability' },
  { source: 'onet_skills', table: 'onet_skill_stats', label: 'skill' },
];
const GROUP_TYPES = ['overall', 'major_group', 'job_zone'];

async function main() {
  console.log(`=== O*NET Stats ${DRY_RUN ? '(DRY RUN / smoke test)' : ''} ===`);
  for (const { source, table, label } of STATS) {
    if (!DRY_RUN) await sql.query(`TRUNCATE TABLE ${table}`);
    for (const gt of GROUP_TYPES) {
      const sel = buildSelect(source, gt);
      let count;
      if (DRY_RUN) {
        const r = await sql.query(`SELECT COUNT(*)::int AS n FROM (${sel}) t`);
        count = r[0].n;
      } else {
        const r = await sql.query(`INSERT INTO ${table} (${STATS_COLS}) ${sel} RETURNING element_id`);
        count = r.length;
      }
      console.log(`Computing ${label} stats (${gt})... ${count} rows`);
    }
  }
  console.log(DRY_RUN ? '\nDry run complete (no writes).' : '\nDone. Stats tables recomputed.');
}

main().catch((err) => { console.error('\nFATAL ERROR:', err.message); process.exit(1); });
