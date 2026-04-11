import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/admin-auth'
import { scanHtmlDir, scanHtmlSubdirs } from '@/lib/html-meta'

const VALID_TYPES = ['dev', 'talks', 'artifact'] as const
type PageType = typeof VALID_TYPES[number]

function getDir(type: PageType): string {
  const dirs: Record<PageType, string> = {
    dev: join(process.cwd(), 'public', 'dev'),
    talks: join(process.cwd(), 'public', 'talks'),
    artifact: join(process.cwd(), 'public', 'artifacts'),
  }
  return dirs[type]
}

/**
 * GET /api/admin/page-meta?type=dev|talks|artifact
 * Returns all filesystem docs for the type merged with DB tag overrides.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type') as PageType | null
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Must be dev, talks, or artifact.' }, { status: 400 })
  }

  const dir = getDir(type)

  // Scan filesystem
  let fsDocs: Array<{
    slug: string
    title: string
    description: string
    html_tags: string[]
    folder?: string
  }>

  if (type === 'artifact') {
    fsDocs = scanHtmlDir(dir).map(d => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      html_tags: d.tags,
    }))
  } else {
    const groups = scanHtmlSubdirs(dir)
    fsDocs = groups.flatMap(g =>
      g.docs.map(d => ({
        slug: d.slug, // already prefixed: "FolderName/doc-slug"
        title: d.title,
        description: d.description,
        html_tags: d.tags,
        folder: g.folder,
        folderTitle: g.folderTitle,
      }))
    )
  }

  // Fetch DB overrides
  let dbRows: Array<{ id: string; slug: string; tags: string[] }> = []
  try {
    dbRows = (await sql`SELECT id, slug, tags FROM page_meta WHERE page_type = ${type}`) as typeof dbRows
  } catch {
    // table may not exist yet — return filesystem data with no overrides
  }
  const dbMap = new Map(dbRows.map(r => [r.slug, { id: r.id, tags: r.tags }]))

  // Merge filesystem + DB
  const result = fsDocs.map(doc => {
    const db = dbMap.get(doc.slug)
    return {
      id: db?.id ?? null,
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      html_tags: doc.html_tags,
      db_tags: db?.tags ?? null,
      effective_tags: db?.tags ?? doc.html_tags,
      folder: (doc as { folder?: string }).folder ?? null,
      folderTitle: (doc as { folderTitle?: string }).folderTitle ?? null,
    }
  })

  return NextResponse.json(result)
}

/**
 * POST /api/admin/page-meta
 * Body: { page_type, slug, tags[] }
 * Upserts a tag override for the given slug.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { page_type, slug, tags } = body

  if (!page_type || !VALID_TYPES.includes(page_type)) {
    return NextResponse.json({ error: 'Invalid page_type' }, { status: 400 })
  }
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }
  if (!Array.isArray(tags)) {
    return NextResponse.json({ error: 'tags must be an array' }, { status: 400 })
  }

  try {
    const rows = await sql`
      INSERT INTO page_meta (page_type, slug, tags)
      VALUES (${page_type}, ${slug}, ${tags})
      ON CONFLICT (page_type, slug)
      DO UPDATE SET tags = EXCLUDED.tags, updated_at = NOW()
      RETURNING id, page_type, slug, tags
    `
    return NextResponse.json(rows[0])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
