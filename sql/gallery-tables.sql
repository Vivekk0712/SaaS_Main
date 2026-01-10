-- Gallery Images Table (MySQL)
-- Stores gallery metadata + local file URL (faster than base64 blobs)

USE sas;

CREATE TABLE IF NOT EXISTS gallery_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(512) NULL,
  image_data LONGTEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If table already exists from older migration, run these safely:
-- ALTER TABLE gallery_images ADD COLUMN image_url VARCHAR(512) NULL;
-- ALTER TABLE gallery_images MODIFY image_data LONGTEXT NULL;

-- Gallery albums (folders)
CREATE TABLE IF NOT EXISTS gallery_albums (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  content TEXT NULL,
  cover_image_url VARCHAR(512) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Album images (photos inside a folder)
CREATE TABLE IF NOT EXISTS gallery_album_images (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Gallery tables created successfully!' AS message;
