import { NextResponse } from 'next/server'
import { exec, query } from '../../../_lib/db'
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
    await ensureGalleryTable()
    const body = await req.json().catch(() => ({}))
    const limit = Math.max(1, Math.min(50, Number(body.limit || 25)))

    const rows = await query<{
      id: number
      image_data: string | null
    }>(
      `SELECT id, image_data
         FROM gallery_images
        WHERE (image_url IS NULL OR image_url = '')
          AND image_data IS NOT NULL
        ORDER BY id ASC
        LIMIT ?`,
      [limit]
    )

    let migrated = 0
    for (const r of rows) {
      const dataUrl = String(r.image_data || '').trim()
      if (!dataUrl) continue
      const fileBaseName = `gallery_${Date.now()}_${r.id}_${Math.random().toString(36).slice(2, 6)}`
      const stored = await storeGalleryImageToPublic({ dataUrl, fileBaseName })
      await exec('UPDATE gallery_images SET image_url = ? WHERE id = ?', [stored.urlPath, r.id])
      migrated += 1
    }

    const remainingRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt
         FROM gallery_images
        WHERE (image_url IS NULL OR image_url = '')
          AND image_data IS NOT NULL`
    )
    const remaining = Number(remainingRows?.[0]?.cnt || 0)

    return NextResponse.json({ ok: true, migrated, remaining })
  } catch (error) {
    console.error('Failed to backfill gallery images:', error)
    return NextResponse.json({ ok: false, error: 'backfill_failed' }, { status: 500 })
  }
}

