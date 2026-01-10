import { NextResponse } from 'next/server'
import { exec, query } from '../../../_lib/db'

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

export async function GET(req: Request) {
  try {
    await ensureGalleryTable()
    const url = new URL(req.url)
    const includeData = url.searchParams.get('includeData') === '1'
    const rows = await query<{
      id: number
      title: string
      description: string | null
      image_url: string | null
      image_data?: string | null
      created_at: string
    }>(
      `SELECT id, title, description, image_url${includeData ? ', image_data' : ''}, created_at
       FROM gallery_images
       ORDER BY created_at DESC`
    )
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      imageUrl: r.image_url || '',
      imageData: includeData ? String((r as any).image_data || '') : '',
      createdAt: r.created_at,
    }))
    return NextResponse.json(
      { items },
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Failed to load gallery images:', error)
    return NextResponse.json({ items: [], error: 'db_error' }, { status: 500 })
  }
}
