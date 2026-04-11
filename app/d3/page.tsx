import path from 'path'
import type { Metadata } from 'next'
import { scanD3Dir } from '@/lib/html-meta'
import { D3Browser } from './D3Browser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'D3 Visualizations | Irreducibly Human',
  description: 'Interactive D3.js data visualizations for the Irreducibly Human curriculum.',
}

export default async function D3Page() {
  const groups = await scanD3Dir(path.join(process.cwd(), 'public/d3'))

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">D3 Visualizations</h1>
      <p className="text-muted-foreground mb-10">
        Interactive data visualizations for the Irreducibly Human curriculum.
      </p>
      <D3Browser groups={groups} />
    </main>
  )
}
