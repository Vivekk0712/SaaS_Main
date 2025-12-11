import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getDb(): mysql.Pool {
  if (pool) return pool
  const url = process.env.DATABASE_URL || ''
  if (url) {
    // When DATABASE_URL is provided (e.g. mysql://sas_app:pass@127.0.0.1:3306/sas),
    // let mysql2 parse it directly so onboarding (3020) uses the exact same DB
    // as the main app (3000).
    pool = mysql.createPool(url)
    return pool
  }
  const host = process.env.DB_HOST || '127.0.0.1'
  const port = Number(process.env.DB_PORT || '3306')
  const user = process.env.DB_USER || 'sas_app'
  const password = process.env.DB_PASSWORD || 'sas_strong_password_123'
  const database = process.env.DB_NAME || 'sas'
  pool = mysql.createPool({ host, port, user, password, database, connectionLimit: 5, charset: 'utf8mb4_general_ci' })
  return pool
}

export async function withConn<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const db = getDb()
  const conn = await db.getConnection()
  try {
    return await fn(conn)
  } finally {
    conn.release()
  }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = getDb()
  const [rows] = await db.query(sql, params || [])
  return rows as T[]
}

export async function exec(sql: string, params?: any[]): Promise<void> {
  const db = getDb()
  await db.execute(sql, params || [])
}
