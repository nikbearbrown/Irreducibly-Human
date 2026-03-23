import Link from 'next/link'
import { notFound } from 'next/navigation'
import { join } from 'path'
import { existsSync } from 'fs'
import { scanHtmlDir } from '@/lib/html-meta'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const docs = scanHtmlDir(join(process.cwd(), 'public', 'dev'))
  const doc = docs.find(d => d.slug === slug)
  if (doc) {
    return {
      title: `${doc.title} - Dev Docs`,
      description: doc.description || doc.title,
    }
  }
  return { title: 'Dev Docs - Irreducibly Human' }
}

export default async function DevDocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const filePath = join(process.cwd(), 'public', 'dev', `${slug}.html`)

  if (!existsSync(filePath)) notFound()

  const docs = scanHtmlDir(join(process.cwd(), 'public', 'dev'))
  const doc = docs.find(d => d.slug === slug)
  const title = doc?.title || slug

  return (
    <div className="flex flex-col w-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="w-full border-b bg-background">
        <div className="container px-4 md:px-6 mx-auto py-4 flex items-center justify-between">
          <div>
            <Link
              href="/dev"
              className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-block"
            >
              ← Back to Docs
            </Link>
            <h1 className="text-2xl font-bold tracking-tighter">{title}</h1>
            {doc?.description && (
              <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 w-full">
        <iframe
          src={`/dev/${slug}.html`}
          title={title}
          className="w-full border-none"
          style={{ minHeight: 'calc(100vh - 12rem)' }}
        />
      </div>
    </div>
  )
}
