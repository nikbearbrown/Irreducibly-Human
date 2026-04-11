import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'

export interface HtmlDocMeta {
  slug: string
  filename: string
  title: string
  description: string
  tags: string[]
}

export interface GroupedHtmlDocs {
  folder: string
  folderTitle: string
  docs: HtmlDocMeta[]
}

function extractTag(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  return match ? match[1].trim() : null
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function scanHtmlDir(dir: string): HtmlDocMeta[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.html')).sort()
  } catch {
    return []
  }

  return files.map(filename => {
    const slug = filename.replace('.html', '')
    let title = titleCase(slug)
    let description = ''
    let tags: string[] = []

    try {
      const html = readFileSync(join(dir, filename), 'utf-8')
      const t = extractTag(html, /<title[^>]*>([^<]+)<\/title>/i)
      if (t) title = t
      const d = extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
        ?? extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)
      if (d) description = d
      const k = extractTag(html, /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)
        ?? extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i)
      if (k) tags = k.split(',').map(t => t.trim()).filter(Boolean)
    } catch {}

    return { slug, filename, title, description, tags }
  })
}

/** Scan subdirectories of `dir`, returning docs grouped by folder name, sorted alphabetically. */
export function scanHtmlSubdirs(dir: string): GroupedHtmlDocs[] {
  let entries: string[]
  try {
    entries = readdirSync(dir).sort()
  } catch {
    return []
  }

  const groups: GroupedHtmlDocs[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    try {
      if (!statSync(fullPath).isDirectory()) continue
    } catch {
      continue
    }

    const docs = scanHtmlDir(fullPath).map(doc => ({
      ...doc,
      // prefix slug with folder so routes resolve correctly
      slug: `${entry}/${doc.slug}`,
    }))

    if (docs.length > 0) {
      groups.push({
        folder: entry,
        folderTitle: titleCase(entry),
        docs: docs.sort((a, b) => a.title.localeCompare(b.title)),
      })
    }
  }

  return groups
}

// ── D3 visualization scanner ──────────────────────────────────────────────────

export interface D3DocMeta {
  slug: string
  filename: string
  title: string
  description: string
  keywords: string[]
  path: string
}

export interface D3Group {
  folder: string
  docs: D3DocMeta[]
}

/**
 * Scans subdirectories of `dir` for D3 visualization HTML files.
 * Skips folders named `json` or `images`.
 * Returns docs grouped by folder, sorted alphabetically.
 */
export async function scanD3Dir(dir: string): Promise<D3Group[]> {
  if (!existsSync(dir)) return []

  const subdirs = readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'json' && d.name !== 'images')
    .map(d => d.name)
    .sort()

  return subdirs
    .map(folder => {
      const folderPath = join(dir, folder)
      const files = readdirSync(folderPath)
        .filter(f => f.endsWith('.html'))
        .sort()

      const docs: D3DocMeta[] = files.map(filename => {
        const filePath = join(folderPath, filename)
        const content = readFileSync(filePath, 'utf-8')
        const slug = filename.replace(/\.html$/, '')
        const title =
          content.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
            ?.replace(' | Irreducibly Human', '')
            .trim() ?? slug
        const description =
          content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ?? ''
        const keywords = (
          content.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)?.[1] ?? ''
        )
          .split(',')
          .map(k => k.trim())
          .filter(Boolean)

        return { slug, filename, title, description, keywords, path: `/d3/${folder}/${slug}` }
      })

      return { folder, docs }
    })
    .filter(g => g.docs.length > 0)
}
