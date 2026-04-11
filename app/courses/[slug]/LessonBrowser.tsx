'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import type { LessonMeta } from '@/lib/courses'

export function LessonBrowser({ lessons }: { lessons: LessonMeta[] }) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    lessons.forEach(l => l.keywords.forEach(k => set.add(k)))
    return Array.from(set).sort()
  }, [lessons])

  const filtered = useMemo(() => {
    return lessons.filter(l => {
      const q = query.toLowerCase()
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.keywords.some(k => k.toLowerCase().includes(q))
      const matchesTag = !activeTag || l.keywords.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [lessons, query, activeTag])

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search lessons…"
          className="w-full pl-10 pr-10 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center mb-8">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={activeTag === tag ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {query || activeTag ? 'No lessons match your search.' : 'No lessons yet.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(lesson => (
            <a
              key={lesson.slug}
              href={lesson.path}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border rounded-lg p-5 hover:border-foreground/40 transition-colors bg-background"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-sm leading-snug group-hover:underline">
                  {lesson.title}
                </h3>
                <svg
                  className="shrink-0 h-3.5 w-3.5 text-muted-foreground mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              {lesson.description && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                  {lesson.description}
                </p>
              )}
              {lesson.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lesson.keywords.slice(0, 3).map(k => (
                    <Badge key={k} variant="secondary" className="text-[10px]">
                      {k}
                    </Badge>
                  ))}
                  {lesson.keywords.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{lesson.keywords.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </>
  )
}
