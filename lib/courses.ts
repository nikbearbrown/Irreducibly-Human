import fs from 'fs'
import path from 'path'

export interface CourseMeta {
  slug: string
  title: string
  description: string
  keywords: string[]
  order: number
  lessonCount: number
}

export interface LessonMeta {
  slug: string
  filename: string
  title: string
  description: string
  keywords: string[]
  path: string
}

export function scanCourses(dir: string): CourseMeta[] {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const slug = d.name
      const courseDir = path.join(dir, slug)
      const jsonPath = path.join(courseDir, 'course.json')

      let meta: Partial<CourseMeta> = {}
      if (fs.existsSync(jsonPath)) {
        try { meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) } catch {}
      }

      const lessonCount = fs.readdirSync(courseDir)
        .filter(f => f.endsWith('.html')).length

      return {
        slug,
        title: meta.title ?? slug,
        description: meta.description ?? '',
        keywords: meta.keywords ?? [],
        order: meta.order ?? 99,
        lessonCount,
      }
    })
    .filter(c => c.lessonCount > 0)
    .sort((a, b) => a.order - b.order)
}

export function scanLessons(dir: string, courseSlug: string): LessonMeta[] {
  const courseDir = path.join(dir, courseSlug)
  if (!fs.existsSync(courseDir)) return []

  return fs.readdirSync(courseDir)
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(filename => {
      const content = fs.readFileSync(path.join(courseDir, filename), 'utf-8')
      const slug = filename.replace(/\.html$/, '')
      const rawTitle = content.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? slug
      const title = rawTitle.replace(/\s*\|.*$/, '').trim() || slug
      const description =
        content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ?? ''
      const keywords = (
        content.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)?.[1] ?? ''
      )
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)

      return { slug, filename, title, description, keywords, path: `/courses/${courseSlug}/${slug}.html` }
    })
}
