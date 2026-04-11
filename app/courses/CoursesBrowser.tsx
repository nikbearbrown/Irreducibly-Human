'use client'

import Link from 'next/link'

interface Course {
  slug: string
  title: string
  subtitle: string
  description: string
  tier: string
}

export function CoursesBrowser({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {courses.map((course) => (
        <Link
          key={course.slug}
          href={`/courses/${course.slug}`}
          className="rounded-lg border bg-card p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-bold tracking-wide">
              {course.title}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {course.tier}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {course.subtitle}
          </p>
          <p className="text-muted-foreground leading-relaxed flex-1">
            {course.description}
          </p>
          <span className="mt-6 text-sm font-medium text-foreground">
            View course →
          </span>
        </Link>
      ))}
    </div>
  )
}
