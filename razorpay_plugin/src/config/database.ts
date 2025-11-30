import mysql from 'mysql2/promise';
import { env } from './env.js';
import { logger } from './logger.js';

let pool: mysql.Pool | null = null;

export function getDatabase(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: parseInt(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    logger.info('Database connection pool created');
  }

  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.query('SELECT 1');
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    return false;
  }
}
