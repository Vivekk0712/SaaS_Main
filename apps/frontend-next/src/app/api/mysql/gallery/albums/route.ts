import { NextResponse } from 'next/server'
import { exec, query } from '../../../_lib/db'
import { ensureGalleryAlbumsTables } from './_lib/db'
import { storeGalleryImageToPublic } from '../_lib/storage'

export async function GET() {
  try {
    await ensureGalleryAlbumsTables()
    const rows = await query<{
      id: number
      title: string
      content: string | null
      cover_image_url: string | null
      created_at: string
      imageCount: number
    }>(
      `SELECT a.id,
              a.title,
              a.content,
              a.cover_image_url,
              a.created_at,
              (SELECT COUNT(*) FROM gallery_album_images i WHERE i.album_id = a.id) AS imageCount
         FROM gallery_albums a
        ORDER BY a.created_at DESC`
    )
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content || '',
      coverImageUrl: r.cover_image_url || '',
      createdAt: r.created_at,
      imageCount: Number(r.imageCount || 0),
    }))
    return NextResponse.json({ items }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    console.error('Failed to list gallery albums:', error)
    return NextResponse.json({ items: [], error: 'db_error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureGalleryAlbumsTables()
    const body = await req.json().catch(() => ({}))
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()
    const coverData = String(body.coverImageData || '').trim()

    if (!title) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

    let coverImageUrl: string | null = null
    if (coverData) {
      const fileBaseName = `albumcover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const stored = await storeGalleryImageToPublic({ dataUrl: coverData, fileBaseName, maxBytes: 15 * 1024 * 1024 })
      coverImageUrl = stored.urlPath
    }

    await exec('INSERT INTO gallery_albums (title, content, cover_image_url) VALUES (?, ?, ?)', [
      title,
      content || null,
      coverImageUrl,
    ])

    const created = await query<{ id: number }>('SELECT LAST_INSERT_ID() AS id')
    return NextResponse.json({ ok: true, id: Number(created?.[0]?.id || 0) })
  } catch (error) {
    console.error('Failed to create gallery album:', error)
    if ((error as any)?.message === 'file_too_large') {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
    }
    if ((error as any)?.message === 'invalid_data_url') {
      return NextResponse.json({ error: 'invalid_image' }, { status: 400 })
    }
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
}

