'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, RotateCcw } from 'lucide-react'

interface DocMeta {
  id: string | null
  slug: string
  title: string
  description: string
  html_tags: string[]
  db_tags: string[] | null
  effective_tags: string[]
  folder: string | null
  folderTitle: string | null
}

export default function TalksAdminPage() {
  const [docs, setDocs] = useState<DocMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingDoc, setEditingDoc] = useState<DocMeta | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/page-meta?type=talks')
      if (!res.ok) throw new Error('Failed to load talks')
      setDocs(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading talks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  function openEdit(doc: DocMeta) {
    setEditingDoc(doc)
    setTagsInput((doc.db_tags ?? doc.html_tags).join(', '))
  }

  async function saveTags() {
    if (!editingDoc) return
    setSaving(true)
    setError('')
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const res = await fetch('/api/admin/page-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_type: 'talks', slug: editingDoc.slug, tags }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setEditingDoc(null)
      fetchDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving tags')
    } finally {
      setSaving(false)
    }
  }

  async function resetTags(doc: DocMeta) {
    if (!doc.id) return
    if (!confirm(`Reset "${doc.title}" tags to HTML meta defaults?`)) return
    try {
      const res = await fetch(`/api/admin/page-meta/${doc.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to reset')
      fetchDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resetting tags')
    }
  }

  // Group docs by folder for display
  const grouped = docs.reduce<Record<string, DocMeta[]>>((acc, doc) => {
    const key = doc.folderTitle ?? 'Root'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter">Talks — Tags</h2>
        <p className="text-sm text-muted-foreground">
          Edit tags for talks. DB overrides replace HTML meta keywords on the public page.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-muted-foreground">No talks found in public/talks/.</p>
      ) : (
        Object.entries(grouped).map(([folderTitle, folderDocs]) => (
          <div key={folderTitle}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {folderTitle}
            </h3>
            <div className="grid gap-3">
              {folderDocs.map(doc => (
                <Card key={doc.slug}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{doc.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">{doc.slug}</Badge>
                        {doc.db_tags !== null && (
                          <Badge variant="secondary" className="text-xs">DB override</Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5 shrink-0 ml-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {doc.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetTags(doc)}
                          title="Reset to HTML meta tags"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {doc.effective_tags.length > 0 ? (
                        doc.effective_tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No tags</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={!!editingDoc} onOpenChange={open => { if (!open) setEditingDoc(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tags — {editingDoc?.title}</DialogTitle>
            <DialogDescription>
              {editingDoc?.db_tags !== null
                ? 'Currently using DB override. Save to update, or use the reset button to revert to HTML meta.'
                : 'Currently using HTML meta keywords. Save to create a DB override.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editingDoc && editingDoc.html_tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">HTML meta tags (original):</p>
                <div className="flex flex-wrap gap-1">
                  {editingDoc.html_tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
            <Button onClick={saveTags} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
