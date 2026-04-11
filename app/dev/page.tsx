import { join } from 'path'
import type { Metadata } from 'next'
import { sql } from '@/lib/db'
import { scanHtmlSubdirs } from '@/lib/html-meta'
import DevBrowser from './DevBrowser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dev Notes - Irreducibly Human',
  description: 'Developer specs of Irreducibly Human projects.',
}

export default async function DevPage() {
  const groups = scanHtmlSubdirs(join(process.cwd(), 'public', 'dev'))

  // Fetch DB tag overrides — DB takes priority over HTML meta keywords
  let dbTagMap = new Map<string, string[]>()
  try {
    const rows = await sql`SELECT slug, tags FROM page_meta WHERE page_type = 'dev'`
    dbTagMap = new Map((rows as { slug: string; tags: string[] }[]).map(r => [r.slug, r.tags]))
  } catch {}

  const mergedGroups = groups.map(g => ({
    ...g,
    docs: g.docs.map(d => ({
      ...d,
      tags: dbTagMap.has(d.slug) ? dbTagMap.get(d.slug)! : d.tags,
    })),
  }))

  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Irreducibly Human: Dev Notes</h1>
        <p className="text-muted-foreground mb-10">
          Developer specs of Irreducibly Human projects.
        </p>
        <DevBrowser groups={mergedGroups} />
      </div>
    </div>
  )
}
