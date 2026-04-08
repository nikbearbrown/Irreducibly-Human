import Link from 'next/link'
import { notFound } from 'next/navigation'
import { join } from 'path'
import { existsSync } from 'fs'
import { scanHtmlSubdirs } from '@/lib/html-meta'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const slugPath = slug.join('/')
  const groups = scanHtmlSubdirs(join(process.cwd(), 'public', 'talks'))
  for (const g of groups) {
    const doc = g.docs.find(d => d.slug === slugPath)
    if (doc) {
      return {
        title: `${doc.title} - Talks | Irreducibly Human`,
        description: doc.description || doc.title,
      }
    }
  }
  return { title: 'Talks | Irreducibly Human' }
}

export async function generateStaticParams() {
  const groups = scanHtmlSubdirs(join(process.cwd(), 'public', 'talks'))
  const params: { slug: string[] }[] = []
  for (const g of groups) {
    for (const doc of g.docs) {
      params.push({ slug: doc.slug.split('/') })
    }
  }
  return params
}

export default async function TalkPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const slugPath = slug.join('/')
  const filePath = join(process.cwd(), 'public', 'talks', `${slugPath}.html`)

  if (!existsSync(filePath)) notFound()

  const groups = scanHtmlSubdirs(join(process.cwd(), 'public', 'talks'))
  let title = slug[slug.length - 1]
  let description = ''
  let author = ''
  let folderTitle = ''
  for (const g of groups) {
    const doc = g.docs.find(d => d.slug === slugPath)
    if (doc) {
      title = doc.title
      description = doc.description
      author = doc.author || ''
      folderTitle = g.folderTitle
      break
    }
  }

  return (
    <div className="flex flex-col w-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="w-full border-b bg-background">
        <div className="container px-4 md:px-6 mx-auto py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Link href="/talks" className="hover:text-foreground">
                Talks
              </Link>
              {folderTitle && (
                <>
                  <span>›</span>
                  <span>{folderTitle}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {author && (
                <span className="text-sm text-muted-foreground">{author}</span>
              )}
              {description && (
                <>
                  {author && <span className="text-sm text-muted-foreground">·</span>}
                  <span className="text-sm text-muted-foreground">{description}</span>
                </>
              )}
            </div>
          </div>
          <a
            href={`/talks/${slugPath}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            Full Screen ↗
          </a>
        </div>
      </div>
      <div className="flex-1 w-full">
        <iframe
          src={`/talks/${slugPath}.html`}
          title={title}
          className="w-full border-none"
          style={{ minHeight: 'calc(100vh - 12rem)' }}
        />
      </div>
    </div>
  )
}
