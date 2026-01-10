"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

type Album = {
  id: number
  title: string
  content: string
  coverImageUrl: string
  createdAt: string
  imageCount: number
}

type AlbumImage = {
  id: number
  albumId: number
  title: string
  description: string
  imageUrl: string
  createdAt: string
}

export default function AdminAlbumDetailPage() {
  const pathname = usePathname()
  const params = useParams<{ id: string }>()
  const albumId = Number(params?.id || 0)

  const [album, setAlbum] = React.useState<Album | null>(null)
  const [items, setItems] = React.useState<AlbumImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [selected, setSelected] = React.useState<Array<{ name: string; dataUrl: string }>>([])
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<{ done: number; total: number } | null>(null)

  const load = async () => {
    try {
      const [aRes, iRes] = await Promise.all([
        fetch('/api/mysql/gallery/albums').then((r) => r.json()),
        fetch(`/api/mysql/gallery/albums/${albumId}/images`).then((r) => r.json()),
      ])
      const albums = Array.isArray(aRes?.items) ? (aRes.items as Album[]) : []
      setAlbum(albums.find((x) => x.id === albumId) || null)
      setItems(Array.isArray(iRes?.items) ? (iRes.items as AlbumImage[]) : [])
    } catch {
      setAlbum(null)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!albumId) return
    load()
  }, [albumId])

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

        const r = await fetch(`/api/mysql/gallery/albums/${albumId}/images`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: itemTitle,
            description: commonDesc,
            imageData: it.dataUrl,
          }),
        })
        const j = await r.json().catch(() => ({} as any))
        if (!r.ok || !j?.ok) {
          const err = String(j?.error || '')
          if (r.status === 413 || err === 'file_too_large') alert('One image is too large (max 15MB).')
          else alert('Upload failed.')
          return
        }
        setUploadProgress({ done: i + 1, total: selected.length })
      }
      setTitle('')
      setDescription('')
      setSelected([])
      await load()
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const setAsCover = async (imageUrl: string) => {
    try {
      const r = await fetch(`/api/mysql/gallery/albums/${albumId}/cover`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const j = await r.json().catch(() => ({} as any))
      if (!r.ok || !j?.ok) {
        alert('Failed to set cover.')
        return
      }
      await load()
    } catch {
      alert('Failed to set cover.')
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
              <div className="gallery-kicker">Album</div>
              <h1>{album?.title || 'Album'}</h1>
              <p>{album?.content || 'Upload photos to this folder. You can set any photo as cover.'}</p>
            </div>
            <div className="gallery-hero-card">
              <div className="gallery-hero-title">Cover</div>
              <div className="gallery-hero-sub">
                {album?.coverImageUrl ? <img src={album.coverImageUrl} alt="Cover" style={{ width: 180, height: 120, objectFit: 'contain', borderRadius: 12, background: '#0f172a' }} /> : 'No cover yet'}
              </div>
            </div>
          </div>

          <section className="card gallery-upload-card">
            <div className="gallery-upload-grid">
              <div>
                <label className="label">Title (optional)</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                <label className="label">Description (optional)</label>
                <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                <label className="label">Upload image</label>
                <input type="file" accept="image/*" multiple onChange={(e) => onPickFiles(e.target.files)} />
                <button className="btn" type="button" onClick={onUpload} disabled={uploading}>
                  {uploading
                    ? uploadProgress
                      ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                      : 'Uploading...'
                    : 'Upload to album'}
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
                    {selected.length > 9 ? <div className="upload-preview-more">+{selected.length - 9}</div> : null}
                  </div>
                ) : (
                  <div className="note">Select one or more images to preview.</div>
                )}
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18, borderRadius: 18 }}>
            <div className="gallery-head">
              <div>
                <div className="gallery-title">Photos</div>
                <div className="note">Click “Set cover” on any photo.</div>
              </div>
            </div>
            {loading && <div className="note">Loading photos...</div>}
            {!loading && items.length === 0 && <div className="note">No photos yet.</div>}
            {items.length > 0 && (
              <div className="parent parent-gallery-grid" aria-label="Album photos grid">
                {items.map((item, idx) => {
                  const variant = (idx % 3) + 1
                  return (
                    <div key={item.id} className="parent-gallery-cell">
                      <article className={`parent-gallery-card electric-border electric-border-${variant}`}>
                        <a href={item.imageUrl} target="_blank" rel="noreferrer" className="parent-gallery-media">
                          <img src={item.imageUrl} alt={item.title || 'Photo'} loading="lazy" />
                        </a>
                        <div className="parent-gallery-meta">
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <div className="parent-gallery-meta-title">{item.title || 'Photo'}</div>
                            <button
                              type="button"
                              className="btn-ghost"
                              style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999 }}
                              onClick={() => setAsCover(item.imageUrl)}
                            >
                              Set cover
                            </button>
                          </div>
                          {item.description ? <div className="parent-gallery-meta-desc">{item.description}</div> : null}
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
