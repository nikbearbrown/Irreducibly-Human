import path from 'path'
import Link from 'next/link'
import type { Metadata } from 'next'
import { scanCourses } from '@/lib/courses'

export const metadata: Metadata = {
  title: 'Courses | Irreducibly Human',
  description: 'Hands-on course sequences for the Irreducibly Human curriculum.',
}

export default function CoursesPage() {
  const courses = scanCourses(path.join(process.cwd(), 'public/courses'))

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Courses</h1>
      <p className="text-muted-foreground mb-10">
        Hands-on sequences of interactive lessons. Click a course to browse its lessons.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => (
          <Link
            key={course.slug}
            href={`/courses/${course.slug}`}
            className="group block border rounded-lg p-6 hover:border-foreground/40 transition-colors bg-background"
          >
            <h2 className="font-semibold text-base leading-snug group-hover:underline mb-2">
              {course.title}
            </h2>
            {course.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {course.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
            </p>
          </Link>
        ))}
        {courses.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-full">No courses yet.</p>
        )}
      </div>
    </main>
  )
}
