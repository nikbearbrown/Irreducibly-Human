import { join } from 'path'
import { readFileSync } from 'fs'
import type { Metadata } from 'next'
import { scanHtmlSubdirs } from '@/lib/html-meta'
import TalksBrowser from './TalksBrowser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Talks | Irreducibly Human',
  description: 'Browse talks and presentations.',
}

export default function TalksPage() {
  const groups = scanHtmlSubdirs(join(process.cwd(), 'public', 'talks'))

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
        <TalksBrowser groups={groups} filterTags={filterTags} />
      </div>
    </div>
  )
}
