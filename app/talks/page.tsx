import { join } from 'path'
import { readFileSync } from 'fs'
import type { Metadata } from 'next'
import { sql } from '@/lib/db'
import { scanHtmlSubdirs } from '@/lib/html-meta'
import TalksBrowser from './TalksBrowser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Talks | Irreducibly Human',
  description: 'Browse talks and presentations.',
}

export default async function TalksPage() {
  const groups = scanHtmlSubdirs(join(process.cwd(), 'public', 'talks'))

  // Fetch DB tag overrides — DB takes priority over HTML meta keywords
  let dbTagMap = new Map<string, string[]>()
  try {
    const rows = await sql`SELECT slug, tags FROM page_meta WHERE page_type = 'talks'`
    dbTagMap = new Map((rows as { slug: string; tags: string[] }[]).map(r => [r.slug, r.tags]))
  } catch {}

  const mergedGroups = groups.map(g => ({
    ...g,
    docs: g.docs.map(d => ({
      ...d,
      tags: dbTagMap.has(d.slug) ? dbTagMap.get(d.slug)! : d.tags,
    })),
  }))

  let filterTags: string[] = []
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'talks', 'filters.json'), 'utf-8')
    filterTags = JSON.parse(raw)
  } catch {}

  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Talks</h1>
        <p className="text-muted-foreground mb-10">
          Browse talks and presentations.
        </p>
        <TalksBrowser groups={mergedGroups} filterTags={filterTags} />
      </div>
    </div>
  )
}
