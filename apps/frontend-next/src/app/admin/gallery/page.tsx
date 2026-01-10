"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { detectImageOrientation, type ImageOrientation } from '../../_lib/gallery/orientation'

type GalleryItem = {
  id: number
  title: string
  description: string
  imageUrl?: string
  imageData?: string
  createdAt: string
}

export default function AdminGalleryPage() {
  const pathname = usePathname()
  const [items, setItems] = React.useState<GalleryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [orientationById, setOrientationById] = React.useState<Record<number, ImageOrientation>>({})
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [selected, setSelected] = React.useState<Array<{ name: string; dataUrl: string }>>([])
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<{ done: number; total: number } | null>(null)

  const load = async () => {
    try {
      const r = await fetch('/api/mysql/gallery/list')
      const j = await r.json()
      setItems(Array.isArray(j.items) ? j.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      const next: Record<number, ImageOrientation> = {}
      await Promise.all(
        items.map(async (item) => {
          const src = item.imageUrl || item.imageData || ''
          const o = await detectImageOrientation(src)
          next[item.id] = o
        })
      )
      if (cancelled) return
      setOrientationById(next)
    }
    if (items.length) run()
    return () => {
      cancelled = true
    }
  }, [items])

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('read_failed'))
      reader.readAsDataURL(file)
    })

  const baseName = (name: string) => {
    const n = String(name || '').trim()
    if (!n) return 'Photo'
    const dot = n.lastIndexOf('.')
    return dot > 0 ? n.slice(0, dot) : n
  }

  const onPickFiles = async (files?: FileList | null) => {
    const list = files ? Array.from(files) : []
    if (!list.length) return
    try {
      const next = await Promise.all(
        list.map(async (f) => ({
          name: f.name,
          dataUrl: await fileToDataUrl(f),
        }))
      )
      setSelected(next)
    } catch {
      alert('Could not read one of the selected files.')
    }
  }

  const onUpload = async () => {
    if (!selected.length) {
      alert('Choose image(s).')
      return
    }
    setUploading(true)
    setUploadProgress({ done: 0, total: selected.length })
    try {
      const commonTitle = title.trim()
      const commonDesc = description.trim()
      for (let i = 0; i < selected.length; i++) {
        const it = selected[i]
        const derived = baseName(it.name)
        const itemTitle = commonTitle
          ? selected.length > 1
            ? `${commonTitle} ${i + 1}`
            : commonTitle
          : derived

        const r = await fetch('/api/mysql/gallery/upload', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: itemTitle,
            description: commonDesc,
            imageData: it.dataUrl,
          }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({} as any))
          const err = String(j?.error || '')
          if (r.status === 413 || err === 'file_too_large') {
            alert('One image is too large. Please upload smaller images (max 15MB).')
          } else if (r.status === 400 || err === 'invalid_image' || err === 'missing_fields') {
            alert('One image is invalid. Please re-pick and try again.')
          } else {
            alert('Upload failed. Please try again.')
          }
          return
        }
        setUploadProgress({ done: i + 1, total: selected.length })
      }
      setTitle('')
      setDescription('')
      setSelected([])
      await load()
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
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
            <Link className={`tab ${pathname?.startsWith('/admin/dashboard') ? '' : ''}`} href="/admin/dashboard">
              Dashboard
            </Link>
            <Link className={`tab ${pathname?.startsWith('/admin/gallery') ? 'tab-active' : ''}`} href="/admin/gallery">
              Gallery
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
              <h1>Gallery Uploads</h1>
              <p>Upload new images for the parent gallery and preview them below.</p>
            </div>
            <div className="gallery-hero-card">
              <div className="gallery-hero-title">Parent Gallery</div>
              <div className="gallery-hero-sub">
                <Link className="back" href="/parent/gallery">
                  Preview parent gallery
                </Link>
              </div>
            </div>
          </div>

          <section className="card gallery-upload-card">
            <div className="gallery-upload-grid">
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Day Highlights"
                />
                <label className="label">Description (optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short caption for parents"
                />
                <label className="label">Upload image</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onPickFiles(e.target.files)}
                />
                <button className="btn" type="button" onClick={onUpload} disabled={uploading}>
                  {uploading
                    ? uploadProgress
                      ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                      : 'Uploading...'
                    : 'Publish to Gallery'}
                </button>
              </div>
              <div className="gallery-upload-preview">
                {selected.length ? (
                  <div className="upload-preview-grid" aria-label="Selected images preview">
                    {selected.slice(0, 9).map((it) => (
                      <div key={it.name} className="upload-preview-tile">
                        <img src={it.dataUrl} alt={it.name} />
                      </div>
                    ))}
                    {selected.length > 9 ? (
                      <div className="upload-preview-more">+{selected.length - 9}</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="note">Select one or more images to preview.</div>
                )}
              </div>
            </div>
          </section>

          <section className="card gallery-carousel" style={{ padding: 18, borderRadius: 18 }}>
            <div className="gallery-head">
              <div>
                <div className="gallery-title">Gallery Preview</div>
                <div className="note">All uploaded images (latest first).</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999 }}
                  onClick={async () => {
                    if (!confirm('Delete all gallery photos? This cannot be undone.')) return
                    try {
                      const r = await fetch('/api/mysql/gallery/clear', { method: 'POST' })
                      const j = await r.json().catch(() => ({} as any))
                      if (j?.ok) {
                        alert(`Cleared gallery. Deleted files: ${j.deletedFiles || 0}.`)
                        await load()
                      } else {
                        alert('Clear failed.')
                      }
                    } catch {
                      alert('Clear failed.')
                    }
                  }}
                >
                  Clear all photos
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999 }}
                  onClick={async () => {
                    try {
                      const r = await fetch('/api/mysql/gallery/backfill', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ limit: 25 }),
                      })
                      const j = await r.json().catch(() => ({}))
                      if (j?.ok) {
                        alert(`Migrated ${j.migrated} images. Remaining: ${j.remaining}.`)
                        await load()
                      } else {
                        alert('Migration failed.')
                      }
                    } catch {
                      alert('Migration failed.')
                    }
                  }}
                >
                  Move DB images to disk
                </button>
              </div>
            </div>
            {loading && <div className="note">Loading gallery...</div>}
            {!loading && items.length === 0 && <div className="note">No images yet.</div>}
            {items.length > 0 && (
              <div className="parent parent-gallery-grid" aria-label="Gallery preview grid">
                {items.map((item, idx) => {
                  const variant = (idx % 3) + 1
                  const src = item.imageUrl || item.imageData || ''
                  const orientation = orientationById[item.id] || 'portrait'
                  return (
                    <div key={item.id} className={`parent-gallery-cell is-${orientation}`}>
                      <article className={`parent-gallery-card is-${orientation} electric-border electric-border-${variant}`}>
                        <a href={src} target="_blank" rel="noreferrer" className="parent-gallery-media">
                          <img src={src} alt={item.title} loading="lazy" />
                        </a>
                        <div className="parent-gallery-meta">
                          <div className="parent-gallery-meta-title">{item.title}</div>
                          {item.description ? (
                            <div className="parent-gallery-meta-desc">{item.description}</div>
                          ) : null}
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
