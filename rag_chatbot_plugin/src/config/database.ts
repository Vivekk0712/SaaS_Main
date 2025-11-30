import mysql from 'mysql2/promise';
import { config } from './env';
import { logger } from './logger';

let pool: mysql.Pool | null = null;

export const getDatabase = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    logger.info('Database pool created');
  }
  return pool;
};

export const initDatabase = async () => {
  const db = getDatabase();
  
  // Create tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS uploads (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      file_name VARCHAR(512) NOT NULL,
      file_path VARCHAR(1024) NOT NULL,
      student_id BIGINT NOT NULL,
      class_id INT NOT NULL,
      qdrant_collection VARCHAR(128) NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student (student_id),
      INDEX idx_class (class_id)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ingestion_jobs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      upload_id BIGINT NOT NULL,
      status ENUM('pending','processing','done','failed') DEFAULT 'pending',
      processed_at DATETIME,
      chunks_count INT DEFAULT 0,
      error_message TEXT,
      FOREIGN KEY (upload_id) REFERENCES uploads(id),
      INDEX idx_status (status)
    )
  `);
  
  logger.info('Database tables initialized');
};
