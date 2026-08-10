import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Full occupation list (soc_code + title) for the "Browse all occupations"
// drawer. The payload is ~1,000 short rows, so the drawer fetches it once and
// filters client-side rather than round-tripping per keystroke.
interface OccRow {
  soc_code: string
  title: string
  major_group_code: string | null
  major_group_name: string | null
}

export async function GET() {
  try {
    // Ordered by major group then title so the drawer can render grouped,
    // alphabetised sections without re-sorting client-side.
    const rows = (await sql`
      SELECT soc_code, title, major_group_code, major_group_name
      FROM onet_occupations
      ORDER BY major_group_code ASC, title ASC
    `) as unknown as OccRow[]
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[api/onet/occupations] Database error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
