import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getDb(): mysql.Pool {
  if (pool) return pool
  const url = process.env.DATABASE_URL || ''
  if (!url) {
    const host = process.env.DB_HOST || '127.0.0.1'
    const port = Number(process.env.DB_PORT || '3306')
    const user = process.env.DB_USER || 'sas_app'
    const password = process.env.DB_PASSWORD || 'sas_strong_password_123'
    const database = process.env.DB_NAME || 'sas'
    pool = mysql.createPool({ host, port, user, password, database, connectionLimit: 5, charset: 'utf8mb4_general_ci' })
    return pool
  }
  pool = mysql.createPool({ uri: url, connectionLimit: 5 } as any)
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
