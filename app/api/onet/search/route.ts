import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Returned occupation shape. soc_code is ALWAYS the full O*NET format (e.g.
// "15-1252.00") because every branch selects onet_occupations.soc_code — the
// /employment route depends on receiving full codes for its title lookup.
interface SearchResult {
  soc_code: string
  title: string
  description_excerpt: string
  job_zone: number | null
  major_group_name: string | null
}

// Escape LIKE/ILIKE wildcards so a literal % or _ in the query is not treated
// as a wildcard. Backslash is Postgres's default LIKE escape character.
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limitRaw = parseInt(searchParams.get('limit') || '10', 10)
  const limit = Math.min(20, Math.max(1, Number.isNaN(limitRaw) ? 10 : limitRaw))

  if (q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }

  try {
    // Digit-prefix → SOC browse. Covers exact match for both "15-1252" and
    // "15-1252.00" via the prefix LIKE. FTS does not trigger for digit queries.
    if (/^\d{2}/.test(q)) {
      const prefix = escapeLike(q) + '%'
      const rows = (await sql`
        SELECT soc_code, title, LEFT(COALESCE(description, ''), 120) AS description_excerpt,
               job_zone, major_group_name
        FROM onet_occupations
        WHERE soc_code LIKE ${prefix}
        ORDER BY soc_code ASC
        LIMIT ${limit}
      `) as unknown as SearchResult[]
      return NextResponse.json(rows)
    }

    const like = '%' + escapeLike(q) + '%'

    // Hybrid search: FTS (title weight A, description weight B) OR ILIKE on
    // title/alternate_title. ts_rank in ORDER BY only (not selected) so ILIKE-
    // only hits naturally rank 0 and sort after FTS hits.
    // websearch_to_tsquery is forgiving (bare 'and'/'or' → empty query, no
    // throw), but per spec we still wrap it and fall back to ILIKE-only if the
    // FTS query construction errors.
    try {
      const rows = (await sql`
        SELECT o.soc_code, o.title, LEFT(COALESCE(o.description, ''), 120) AS description_excerpt,
               o.job_zone, o.major_group_name
        FROM onet_occupations o
        LEFT JOIN onet_alternate_titles a ON a.soc_code = o.soc_code
        WHERE (
                setweight(to_tsvector('english', COALESCE(o.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(o.description, '')), 'B')
              ) @@ websearch_to_tsquery('english', ${q})
           OR o.title ILIKE ${like}
           OR a.alternate_title ILIKE ${like}
        GROUP BY o.soc_code, o.title, o.description, o.job_zone, o.major_group_name
        ORDER BY MAX(ts_rank(
                   setweight(to_tsvector('english', COALESCE(o.title, '')), 'A') ||
                   setweight(to_tsvector('english', COALESCE(o.description, '')), 'B'),
                   websearch_to_tsquery('english', ${q})
                 )) DESC, o.title ASC
        LIMIT ${limit}
      `) as unknown as SearchResult[]
      return NextResponse.json(rows)
    } catch (ftsErr) {
      console.error('[api/onet/search] FTS failed, falling back to ILIKE-only:', ftsErr)
      const rows = (await sql`
        SELECT o.soc_code, o.title, LEFT(COALESCE(o.description, ''), 120) AS description_excerpt,
               o.job_zone, o.major_group_name
        FROM onet_occupations o
        LEFT JOIN onet_alternate_titles a ON a.soc_code = o.soc_code
        WHERE o.title ILIKE ${like}
           OR a.alternate_title ILIKE ${like}
        GROUP BY o.soc_code, o.title, o.description, o.job_zone, o.major_group_name
        ORDER BY o.title ASC
        LIMIT ${limit}
      `) as unknown as SearchResult[]
      return NextResponse.json(rows)
    }
  } catch (err) {
    console.error('[api/onet/search] Database error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
