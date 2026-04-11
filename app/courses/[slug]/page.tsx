import path from 'path'
import fs from 'fs'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { scanLessons } from '@/lib/courses'
import { LessonBrowser } from './LessonBrowser'

interface Props {
  params: Promise<{ slug: string }>
}

function readCourseTitle(coursesDir: string, slug: string): string {
  const jsonPath = path.join(coursesDir, slug, 'course.json')
  if (!fs.existsSync(jsonPath)) return slug
  try {
    const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    return meta.title ?? slug
  } catch {
    return slug
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const coursesDir = path.join(process.cwd(), 'public/courses')
  const title = readCourseTitle(coursesDir, slug)
  return {
    title: `${title} | Courses | Irreducibly Human`,
  }
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const coursesDir = path.join(process.cwd(), 'public/courses')
  const lessons = scanLessons(coursesDir, slug)
  if (lessons.length === 0) notFound()

  const title = readCourseTitle(coursesDir, slug)

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-4">
        <a href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Courses
        </a>
      </div>
      <h1 className="text-4xl font-bold tracking-tighter mb-10">{title}</h1>
      <LessonBrowser lessons={lessons} />
    </main>
  )
}
