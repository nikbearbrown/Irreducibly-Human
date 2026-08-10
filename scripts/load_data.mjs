/**
 * load_data.mjs — pipeline orchestrator for the BLS + O*NET data load.
 *
 * RUN (full preview, no DB writes):  node --env-file=.env.local scripts/load_data.mjs --dry-run
 * RUN (real load):                   node --env-file=.env.local scripts/load_data.mjs
 *
 * Subprocess-based: runs each stage script as a child process (reusing the
 * validated, independently-runnable stage scripts) and stops on any failure.
 * --dry-run propagates to every stage. Stage scripts load their own env via
 * --env-file, so this works whether or not the parent was started with it.
 *
 * Stages: [1] BLS import  [2] O*NET import  [3] statistics  [4] alerts
 */
import { spawn } from 'child_process';

const DRY = process.argv.includes('--dry-run');
const NODE = process.execPath;

function run(script) {
  return new Promise((resolve, reject) => {
    const args = ['--env-file=.env.local', script, ...(DRY ? ['--dry-run'] : [])];
    const child = spawn(NODE, args, { env: process.env });
    let out = '';
    child.stdout.on('data', (d) => { const s = d.toString(); out += s; process.stdout.write(s); });
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${script} exited with code ${code}`))));
  });
}

// Extract the "Total rows ...: N" count printed by the import scripts.
function parseCount(out) {
  const m = out.match(/Total rows (?:inserted\/updated|upserted|to upsert):\s*(\d+)/);
  return m ? m[1] : '?';
}

async function main() {
  console.log(`=== LOADER STARTING ${DRY ? '(DRY RUN) ' : ''}===`);

  console.log('[1/4] Running BLS import...');
  const bls = await run('scripts/import-bls.mjs');
  console.log(`[1/4] BLS import complete. ${parseCount(bls)} rows inserted.`);

  console.log('[2/4] Running O*NET import...');
  const onet = await run('scripts/import-onet.mjs');
  console.log(`[2/4] O*NET import complete. ${parseCount(onet)} rows inserted.`);

  console.log('[3/4] Computing statistics...');
  await run('scripts/compute-onet-stats.mjs');
  console.log('[3/4] Statistics complete.');

  console.log('[4/4] Running alerts...');
  await run('scripts/run-alerts.mjs');
  console.log('[4/4] Alerts complete.');

  console.log('=== LOADER COMPLETE. Database is ready. ===');
}

main().catch((err) => {
  console.error(`\n=== LOADER FAILED: ${err.message} ===`);
  process.exit(1);
});
