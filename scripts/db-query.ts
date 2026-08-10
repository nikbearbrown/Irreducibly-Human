/**
 * Run SQL against the Neon database straight from the terminal.
 *
 * Usage:
 *   npx tsx scripts/db-query.ts "SELECT * FROM blog_posts"
 *   npx tsx scripts/db-query.ts "UPDATE tools SET name = 'X' WHERE slug = 'y'"
 *   npx tsx scripts/db-query.ts --file db/schema.sql      (runs each ; statement)
 *
 * Reads DATABASE_URL from .env.local (the same file Next.js uses).
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

// tsx scripts don't auto-load Next.js env files, so load .env.local ourselves.
function loadEnv(file: string) {
  try {
    const text = readFileSync(join(process.cwd(), file), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // .env.local may not exist yet — that's fine, we check DATABASE_URL below.
  }
}

loadEnv('.env.local')

const args = process.argv.slice(2)
const fileMode = args[0] === '--file' || args[0] === '-f'
const input = fileMode ? args[1] : args.join(' ')

if (!input || !input.trim()) {
  console.error('No SQL provided.\n')
  console.error('Usage:')
  console.error('  npx tsx scripts/db-query.ts "SELECT * FROM blog_posts"')
  console.error('  npx tsx scripts/db-query.ts --file db/schema.sql')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.')
  console.error('Add your Neon connection string to .env.local first, e.g.:')
  console.error('  DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
  if (fileMode) {
    const raw = readFileSync(join(process.cwd(), input), 'utf8')
    // Naive split on ';' — fine for plain DDL/DML (no function bodies).
    const statements = raw
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    console.log(`Running ${statements.length} statement(s) from ${input}...\n`)
    for (const [i, stmt] of statements.entries()) {
      await sql.query(stmt)
      console.log(`  [${i + 1}/${statements.length}] ok: ${stmt.split('\n')[0].slice(0, 60)}`)
    }
    console.log('\nDone.')
    return
  }

  const rows = await sql.query(input)
  if (Array.isArray(rows) && rows.length > 0) {
    console.table(rows)
    console.log(`\n${rows.length} row(s).`)
  } else {
    console.log('OK — statement executed (no rows returned).')
  }
}

main().catch((err) => {
  console.error('\nQuery failed:', err.message)
  process.exit(1)
})
