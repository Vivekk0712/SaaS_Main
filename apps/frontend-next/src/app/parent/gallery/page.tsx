"use client"

import React from 'react'
import Link from 'next/link'

type Album = {
  id: number
  title: string
  content: string
  coverImageUrl: string
  createdAt: string
  imageCount: number
}

export default function ParentGalleryPage() {
  const [albums, setAlbums] = React.useState<Album[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
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
    load()
  }, [])

  return (
    <div className="parent-shell parent-gallery-page">
      <div className="topbar topbar-parent">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Parent</strong>
          </div>
          <nav className="tabs" aria-label="Parent navigation">
            <Link className="tab" href="/parent/dashboard">
              Dashboard
            </Link>
            <Link className="tab tab-active" href="/parent/gallery">
              Gallery
            </Link>
          </nav>
        </div>
      </div>

      <div className="dash-wrap parent-main" style={{ paddingTop: 70 }}>
        <main className="parent-gallery-main">
          <div className="parent-gallery-hero">
            <div>
              <div className="parent-gallery-kicker">School SAS</div>
              <h1 className="parent-gallery-title">Gallery</h1>
              <p className="parent-gallery-sub">
                Browse folders created by the HOD. Each folder contains related photos.
              </p>
            </div>
          </div>

          {loading && <div className="note">Loading albums...</div>}
          {!loading && albums.length === 0 && <div className="note">No albums available yet.</div>}

          {albums.length > 0 && (
            <div className="parent parent-gallery-grid" aria-label="Albums grid">
              {albums.map((a, idx) => {
                const variant = (idx % 3) + 1
                const src = a.coverImageUrl || ''
                return (
                  <div key={a.id} className="parent-gallery-cell">
                    <article className={`parent-gallery-card electric-border electric-border-${variant}`}>
                      <Link href={`/parent/gallery/${a.id}`} className="parent-gallery-media">
                        {src ? (
                          <img src={src} alt={a.title} loading="lazy" />
                        ) : (
                          <div className="note" style={{ padding: 12 }}>
                            No cover
                          </div>
                        )}
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
        </main>
      </div>
    </div>
  )
}
