import { exec } from '../../../../_lib/db'

export async function ensureGalleryAlbumsTables() {
  await exec(
    `CREATE TABLE IF NOT EXISTS gallery_albums (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(190) NOT NULL,
      content TEXT NULL,
      cover_image_url VARCHAR(512) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  )

  await exec(
    `CREATE TABLE IF NOT EXISTS gallery_album_images (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      album_id BIGINT NOT NULL,
      title VARCHAR(190) NULL,
      description TEXT NULL,
      image_url VARCHAR(512) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_album_created_at (album_id, created_at),
      CONSTRAINT fk_gallery_album_images_album
        FOREIGN KEY (album_id) REFERENCES gallery_albums(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  )

  // Best-effort compatibility for older schemas.
  try {
    await exec('ALTER TABLE gallery_albums ADD COLUMN content TEXT NULL')
  } catch {}
  try {
    await exec('ALTER TABLE gallery_albums ADD COLUMN cover_image_url VARCHAR(512) NULL')
  } catch {}
}

