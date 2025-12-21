-- Backblaze B2 Storage Migration
-- Add B2 storage columns to materials and textbooks tables

USE sas;

-- Add B2 columns to materials table (check if they exist first)
ALTER TABLE materials 
ADD COLUMN b2_key VARCHAR(500) NULL COMMENT 'Backblaze B2 object key',
ADD COLUMN file_size INT NULL COMMENT 'File size in bytes',
ADD COLUMN b2_path VARCHAR(1000) NULL COMMENT 'Full B2 path/URL';

-- Add B2 columns to textbooks table  
ALTER TABLE textbooks
ADD COLUMN b2_key VARCHAR(500) NULL COMMENT 'Backblaze B2 object key',
ADD COLUMN file_size INT NULL COMMENT 'File size in bytes',
ADD COLUMN b2_path VARCHAR(1000) NULL COMMENT 'Full B2 path/URL';

-- Add index for faster B2 key lookups
ALTER TABLE materials ADD INDEX idx_b2_key (b2_key);
ALTER TABLE textbooks ADD INDEX idx_b2_key (b2_key);

SELECT 'Backblaze B2 migration completed successfully!' AS message;
