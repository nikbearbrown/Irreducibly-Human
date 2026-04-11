'use client'

import { useState, useMemo } from 'react'
import type { LessonMeta } from '@/lib/courses'

export function LessonBrowser({ lessons }: { lessons: LessonMeta[] }) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    lessons.forEach(l => l.keywords.forEach(k => tags.add(k)))
    return Array.from(tags).sort()
  }, [lessons])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return lessons.filter(l => {
      const matchesSearch = !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.keywords.some(k => k.toLowerCase().includes(q))
      const matchesTag = !activeTag || l.keywords.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [lessons, search, activeTag])

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <input
          type="text"
          placeholder="Search lessons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-border rounded-md px-4 py-2 pl-10 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                activeTag === tag
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-6">
        {filtered.length} {filtered.length === 1 ? 'lesson' : 'lessons'}
        {(search || activeTag) ? ' matching' : ' total'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lesson, i) => (
          <a
            key={lesson.slug}
            href={lesson.path}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-border rounded-lg p-5 hover:border-foreground transition-colors bg-background"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-medium text-sm leading-snug group-hover:underline truncate">
                  {lesson.title}
                </h3>
              </div>
              <svg className="shrink-0 h-3.5 w-3.5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            {lesson.description && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 ml-7">
                {lesson.description}
              </p>
            )}
            {lesson.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 ml-7">
                {lesson.keywords.slice(0, 3).map(k => (
                  <span key={k} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">{k}</span>
                ))}
                {lesson.keywords.length > 3 && (
                  <span className="px-2 py-0.5 text-muted-foreground text-xs">+{lesson.keywords.length - 3}</span>
                )}
              </div>
            )}
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">No lessons match your search.</p>
      )}
    </div>
  )
}
