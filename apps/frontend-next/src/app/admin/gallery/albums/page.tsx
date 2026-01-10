"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Album = {
  id: number
  title: string
  content: string
  coverImageUrl: string
  createdAt: string
  imageCount: number
}

export default function AdminGalleryAlbumsPage() {
  const pathname = usePathname()
  const [albums, setAlbums] = React.useState<Album[]>([])
  const [loading, setLoading] = React.useState(true)
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)

  const load = async () => {
    try {
      const r = await fetch('/api/mysql/gallery/albums')
      const j = await r.json()
      setAlbums(Array.isArray(j.items) ? j.items : [])
    } catch {
      setAlbums([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  const onPickCover = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverPreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  const onCreate = async () => {
    if (!title.trim()) {
      alert('Add album title.')
      return
    }
    setCreating(true)
    try {
      const r = await fetch('/api/mysql/gallery/albums', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          coverImageData: coverPreview || '',
        }),
      })
      const j = await r.json().catch(() => ({} as any))
      if (!r.ok || !j?.ok) {
        const err = String(j?.error || '')
        if (r.status === 413 || err === 'file_too_large') alert('Cover image too large (max 15MB).')
        else alert('Create failed.')
        return
      }
      setTitle('')
      setContent('')
      setCoverPreview(null)
      await load()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="gallery-admin-page">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>HOD</strong>
          </div>
          <nav className="tabs" aria-label="HOD navigation">
            <Link className={`tab ${pathname?.startsWith('/admin/dashboard') ? 'tab-active' : ''}`} href="/admin/dashboard">
              Dashboard
            </Link>
            <Link className={`tab ${pathname?.startsWith('/admin/gallery') ? 'tab-active' : ''}`} href="/admin/gallery">
              Photos
            </Link>
            <Link className={`tab ${pathname?.startsWith('/admin/gallery/albums') ? 'tab-active' : ''}`} href="/admin/gallery/albums">
              Albums
            </Link>
          </nav>
        </div>
      </div>

      <div className="dash-wrap">
        <div className="dash">
          <div className="gallery-hero admin-hero">
            <div>
              <div className="gallery-kicker">HOD Control</div>
              <h1>Gallery Albums</h1>
              <p>Create folders with a cover image + content, then upload related photos inside.</p>
            </div>
          </div>

          <section className="card" style={{ padding: 18, borderRadius: 18, marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 16 }}>
              <div>
                <label className="label">Album title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Day 2025" />
                <label className="label">Content (optional)</label>
                <textarea className="input" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Short description for parents" />
                <label className="label">Cover image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => onPickCover(e.target.files?.[0])} />
                <button className="btn" type="button" onClick={onCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create album'}
                </button>
              </div>
              <div className="gallery-upload-preview" style={{ minHeight: 220 }}>
                {coverPreview ? <img src={coverPreview} alt="Cover preview" /> : <div className="note">Cover preview</div>}
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18, borderRadius: 18 }}>
            <div className="gallery-head">
              <div>
                <div className="gallery-title">Albums</div>
                <div className="note">Open any album to upload photos and set cover.</div>
              </div>
            </div>
            {loading && <div className="note">Loading albums...</div>}
            {!loading && albums.length === 0 && <div className="note">No albums yet.</div>}
            {albums.length > 0 && (
              <div className="parent parent-gallery-grid" aria-label="Albums grid">
                {albums.map((a, idx) => {
                  const variant = (idx % 3) + 1
                  const src = a.coverImageUrl || ''
                  return (
                    <div key={a.id} className="parent-gallery-cell">
                      <article className={`parent-gallery-card electric-border electric-border-${variant}`}>
                        <Link href={`/admin/gallery/albums/${a.id}`} className="parent-gallery-media" style={{ display: 'block' }}>
                          {src ? <img src={src} alt={a.title} loading="lazy" /> : <div className="note" style={{ padding: 12 }}>No cover</div>}
                        </Link>
                        <div className="parent-gallery-meta">
                          <div className="parent-gallery-meta-title">{a.title}</div>
                          <div className="parent-gallery-meta-desc">
                            {a.imageCount} photos{a.content ? ` • ${a.content}` : ''}
                          </div>
                        </div>
                      </article>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

