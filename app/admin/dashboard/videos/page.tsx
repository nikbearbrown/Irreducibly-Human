'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Pencil, Trash2, Plus, Pin } from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string | null
  youtube_id: string
  tags: string[]
  pinned: boolean
  published: boolean
  published_at: string | null
  created_at: string
}

const SPECIAL_TAGS = ['botspeak', 'causal reasoning', 'ethical play', 'aimagineering', 'embodied teaching']

const EMPTY_FORM = {
  title: '',
  youtube_id: '',
  description: '',
  tags_input: '',
  pinned: false,
  published: true,
}

export default function VideosAdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/videos')
      if (!res.ok) throw new Error('Failed to load videos')
      const data = await res.json()
      setVideos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  function openNew() {
    setEditingVideo(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(v: Video) {
    setEditingVideo(v)
    setForm({
      title: v.title,
      youtube_id: v.youtube_id,
      description: v.description || '',
      tags_input: (v.tags || []).join(', '),
      pinned: v.pinned,
      published: v.published,
    })
    setDialogOpen(true)
  }

  async function saveVideo() {
    setSaving(true)
    setError('')
    try {
      const tags = form.tags_input
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const payload = {
        title: form.title,
        youtube_id: form.youtube_id,
        description: form.description || null,
        tags,
        pinned: form.pinned,
        published: form.published,
      }

      const url = editingVideo
        ? `/api/admin/videos/${editingVideo.id}`
        : '/api/admin/videos'
      const method = editingVideo ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setDialogOpen(false)
      fetchVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving video')
    } finally {
      setSaving(false)
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('Delete this video?')) return
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting video')
    }
  }

  function addSpecialTag(tag: string) {
    const current = form.tags_input
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    if (!current.includes(tag)) {
      setForm(prev => ({
        ...prev,
        tags_input: [...current, tag].join(', '),
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Videos</h2>
          <p className="text-sm text-muted-foreground">
            Manage YouTube video embeds for the Irreducibly Human videos page.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Video
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-muted-foreground">No videos yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4">
          {videos.map(v => (
            <Card key={v.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {v.title}
                    {v.pinned && (
                      <Badge variant="default" className="gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    <Badge variant={v.published ? 'secondary' : 'outline'}>
                      {v.published ? 'Published' : 'Draft'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{v.youtube_id}</Badge>
                    {v.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </CardDescription>
                  {v.description && (
                    <p className="text-sm text-muted-foreground pt-1">{v.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteVideo(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-md overflow-hidden max-w-sm">
                  <iframe
                    src={`https://www.youtube.com/embed/${v.youtube_id}`}
                    title={v.title}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Edit Video' : 'New Video'}</DialogTitle>
            <DialogDescription>
              {editingVideo ? 'Update the video details.' : 'Add a new video to the directory.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">Title</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Introduction to Causal Reasoning"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-youtube-id">YouTube Video ID</Label>
              <Input
                id="video-youtube-id"
                value={form.youtube_id}
                onChange={e => setForm(prev => ({ ...prev, youtube_id: e.target.value }))}
                placeholder="e.g. hWgWmLWivpo"
              />
              <p className="text-xs text-muted-foreground">
                The ID from the YouTube URL (e.g. youtube.com/watch?v=<strong>hWgWmLWivpo</strong>)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-desc">Description</Label>
              <Textarea
                id="video-desc"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the video"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-tags">Tags (comma-separated)</Label>
              <Input
                id="video-tags"
                value={form.tags_input}
                onChange={e => setForm(prev => ({ ...prev, tags_input: e.target.value }))}
                placeholder="botspeak, causal reasoning"
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {SPECIAL_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addSpecialTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-full border border-input hover:bg-accent transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(prev => ({ ...prev, pinned: e.target.checked }))}
                  className="rounded"
                />
                Pinned (always shown at top)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                  className="rounded"
                />
                Published
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVideo} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
