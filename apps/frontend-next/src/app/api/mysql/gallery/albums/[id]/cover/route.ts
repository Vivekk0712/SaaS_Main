import { NextResponse } from 'next/server'
import { exec } from '../../../../../_lib/db'
import { ensureGalleryAlbumsTables } from '../../../albums/_lib/db'

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    await ensureGalleryAlbumsTables()
    const albumId = Number(ctx.params.id || 0)
    if (!albumId) return NextResponse.json({ error: 'bad_album' }, { status: 400 })
    const body = await req.json().catch(() => ({}))
    const imageUrl = String(body.imageUrl || '').trim()
    if (!imageUrl) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

    await exec('UPDATE gallery_albums SET cover_image_url = ? WHERE id = ?', [imageUrl, albumId])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to set album cover:', error)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
}

