import { join } from 'path'
import type { Metadata } from 'next'
import { scanHtmlDir } from '@/lib/html-meta'
import DevBrowser from './DevBrowser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dev Docs - Irreducibly Human',
  description: 'Developer documentation, guides, and reference materials.',
}

export default function DevPage() {
  const docs = scanHtmlDir(join(process.cwd(), 'public', 'dev'))

  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Dev Docs</h1>
        <p className="text-muted-foreground mb-10">
          Developer documentation, guides, and reference materials.
        </p>
        <DevBrowser docs={docs} />
      </div>
    </div>
  )
}
