import path from 'path'
import { notFound } from 'next/navigation'
import { scanCourse } from '@/lib/courses'
import { LessonBrowser } from './LessonBrowser'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const course = scanCourse(path.join(process.cwd(), 'public/courses'), slug)
  if (!course) return {}
  return {
    title: `${course.title} | Courses | Irreducibly Human`,
    description: course.description,
  }
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const course = scanCourse(path.join(process.cwd(), 'public/courses'), slug)
  if (!course) notFound()

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-2">
        <a href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Courses
        </a>
      </div>
      <h1 className="text-4xl font-bold tracking-tighter mb-2">{course.title}</h1>
      {course.description && (
        <p className="text-muted-foreground mb-10 max-w-2xl">{course.description}</p>
      )}
      <LessonBrowser lessons={course.lessons} />
    </main>
  )
}
