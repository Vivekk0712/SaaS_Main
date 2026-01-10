import { NextResponse } from 'next/server'
import { exec, query } from '../../../_lib/db'
import { deleteGalleryFileByUrl } from '../_lib/storage'

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

export async function POST() {
  try {
    await ensureGalleryTable()
    const rows = await query<{ image_url: string | null }>(
      `SELECT image_url FROM gallery_images WHERE image_url IS NOT NULL AND image_url <> ''`
    )

    let deletedFiles = 0
    for (const r of rows) {
      if (r.image_url && (await deleteGalleryFileByUrl(r.image_url))) deletedFiles += 1
    }

    await exec('TRUNCATE TABLE gallery_images')

    return NextResponse.json({ ok: true, deletedFiles })
  } catch (error) {
    console.error('Failed to clear gallery:', error)
    return NextResponse.json({ ok: false, error: 'clear_failed' }, { status: 500 })
  }
}

