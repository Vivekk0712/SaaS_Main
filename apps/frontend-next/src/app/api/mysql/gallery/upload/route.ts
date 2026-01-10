import { NextResponse } from 'next/server'
import { exec } from '../../../_lib/db'
import { storeGalleryImageToPublic } from '../_lib/storage'

async function ensureGalleryTable() {
  await exec(
    `CREATE TABLE IF NOT EXISTS gallery_images (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      image_url VARCHAR(512) NULL,
      image_data LONGTEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  )
  try {
    await exec('ALTER TABLE gallery_images ADD COLUMN image_url VARCHAR(512) NULL')
  } catch {}
  try {
    await exec('ALTER TABLE gallery_images MODIFY image_data LONGTEXT NULL')
  } catch {}
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const imageData = String(body.imageData || '').trim()

    if (!title || !imageData) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    await ensureGalleryTable()
    const fileBaseName = `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const stored = await storeGalleryImageToPublic({ dataUrl: imageData, fileBaseName, maxBytes: 15 * 1024 * 1024 })
    await exec(
      'INSERT INTO gallery_images (title, description, image_url, image_data) VALUES (?, ?, ?, ?)',
      [title, description || null, stored.urlPath, null]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to upload gallery image:', error)
    if ((error as any)?.message === 'file_too_large') {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
    }
    if ((error as any)?.message === 'invalid_data_url') {
      return NextResponse.json({ error: 'invalid_image' }, { status: 400 })
    }
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
}
