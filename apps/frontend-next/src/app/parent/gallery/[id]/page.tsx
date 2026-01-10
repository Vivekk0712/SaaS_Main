"use client"

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { detectImageOrientation, type ImageOrientation } from '../../../_lib/gallery/orientation'

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

export default function ParentAlbumPage() {
  const params = useParams<{ id: string }>()
  const albumId = Number(params?.id || 0)

  const [album, setAlbum] = React.useState<Album | null>(null)
  const [items, setItems] = React.useState<AlbumImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [orientationById, setOrientationById] = React.useState<Record<number, ImageOrientation>>({})

  React.useEffect(() => {
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
    if (albumId) load()
  }, [albumId])

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      const next: Record<number, ImageOrientation> = {}
      await Promise.all(
        items.map(async (item) => {
          const o = await detectImageOrientation(item.imageUrl)
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
              <div className="parent-gallery-kicker">Album</div>
              <h1 className="parent-gallery-title">{album?.title || 'Album'}</h1>
              <p className="parent-gallery-sub">{album?.content || 'Photos inside this folder.'}</p>
            </div>
          </div>

          {loading && <div className="note">Loading photos...</div>}
          {!loading && items.length === 0 && <div className="note">No photos yet.</div>}

          {items.length > 0 && (
            <div className="parent parent-gallery-grid" aria-label="Album photos grid">
              {items.map((item, idx) => {
                const variant = (idx % 3) + 1
                const orientation = orientationById[item.id] || 'portrait'
                return (
                  <div key={item.id} className={`parent-gallery-cell is-${orientation}`}>
                    <article className={`parent-gallery-card is-${orientation} electric-border electric-border-${variant}`}>
                      <a href={item.imageUrl} target="_blank" rel="noreferrer" className="parent-gallery-media">
                        <img src={item.imageUrl} alt={item.title || 'Photo'} loading="lazy" />
                      </a>
                      <div className="parent-gallery-meta">
                        <div className="parent-gallery-meta-title">{item.title || 'Photo'}</div>
                        {item.description ? <div className="parent-gallery-meta-desc">{item.description}</div> : null}
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
