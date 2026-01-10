import { NextResponse } from 'next/server'
import { exec, query } from '../../../../../_lib/db'
import { ensureGalleryAlbumsTables } from '../../../albums/_lib/db'
import { storeGalleryImageToPublic } from '../../../_lib/storage'

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    await ensureGalleryAlbumsTables()
    const albumId = Number(ctx.params.id || 0)
    if (!albumId) return NextResponse.json({ items: [], error: 'bad_album' }, { status: 400 })

    const rows = await query<{
      id: number
      album_id: number
      title: string | null
      description: string | null
      image_url: string
      created_at: string
    }>(
      `SELECT id, album_id, title, description, image_url, created_at
         FROM gallery_album_images
        WHERE album_id = ?
        ORDER BY created_at DESC`,
      [albumId]
    )
    const items = rows.map((r) => ({
      id: r.id,
      albumId: r.album_id,
      title: r.title || '',
      description: r.description || '',
      imageUrl: r.image_url,
      createdAt: r.created_at,
    }))
    return NextResponse.json({ items }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    console.error('Failed to list album images:', error)
    return NextResponse.json({ items: [], error: 'db_error' }, { status: 500 })
  }
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    await ensureGalleryAlbumsTables()
    const albumId = Number(ctx.params.id || 0)
    if (!albumId) return NextResponse.json({ error: 'bad_album' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const imageData = String(body.imageData || '').trim()
    if (!imageData) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

    const fileBaseName = `album_${albumId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const stored = await storeGalleryImageToPublic({ dataUrl: imageData, fileBaseName, maxBytes: 15 * 1024 * 1024 })

    await exec(
      'INSERT INTO gallery_album_images (album_id, title, description, image_url) VALUES (?, ?, ?, ?)',
      [albumId, title || null, description || null, stored.urlPath]
    )

    // If album has no cover yet, set first uploaded image as cover.
    await exec(
      `UPDATE gallery_albums
          SET cover_image_url = COALESCE(NULLIF(cover_image_url, ''), ?)
        WHERE id = ?`,
      [stored.urlPath, albumId]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to upload album image:', error)
    if ((error as any)?.message === 'file_too_large') {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
    }
    if ((error as any)?.message === 'invalid_data_url') {
      return NextResponse.json({ error: 'invalid_image' }, { status: 400 })
    }
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
}

