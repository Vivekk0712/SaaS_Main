import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function parseDatabaseUrl(url: string) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'mysql:') throw new Error('unsupported protocol')
    const host = u.hostname || '127.0.0.1'
    const port = Number(u.port || '3306')
    const user = decodeURIComponent(u.username || 'sas_app')
    const password = decodeURIComponent(u.password || '')
    const database = (u.pathname || '/sas').replace(/^\//, '') || 'sas'
    return { host, port, user, password, database }
  } catch {
    return null
  }
}

export function getDb(): mysql.Pool {
  if (pool) return pool
  const url = process.env.DATABASE_URL || ''
  const socket = process.env.DB_SOCKET || ''
  if (socket) {
    pool = mysql.createPool({
      socketPath: socket,
      user: process.env.DB_USER || 'sas_app',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sas',
      connectionLimit: 5,
      connectTimeout: 3000,
      charset: 'utf8mb4_general_ci'
    })
    return pool
  }
  if (url) {
    const parsed = parseDatabaseUrl(url)
    if (parsed) {
      // Force TCP by using explicit host from URL; do not create temp pools with empty passwords.
      pool = mysql.createPool({ ...parsed, connectionLimit: 5, connectTimeout: 3000, charset: 'utf8mb4_general_ci' })
      return pool
    }
  }
  // Fallback to discrete env vars only if URL is not provided.
  const host = process.env.DB_HOST || '127.0.0.1'
  const port = Number(process.env.DB_PORT || '3306')
  const user = process.env.DB_USER || 'sas_app'
  const password = process.env.DB_PASSWORD || '9482824040'
  const database = process.env.DB_NAME || 'sas'
  pool = mysql.createPool({ host, port, user, password, database, connectionLimit: 5, connectTimeout: 3000, charset: 'utf8mb4_general_ci' })
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
  return withConn(async (conn) => {
    const [rows] = await conn.query(sql, params || [])
    return rows as T[]
  })
}

export async function exec(sql: string, params?: any[]): Promise<void> {
  await withConn(async (conn) => {
    await conn.execute(sql, params || [])
  })
}

export function toHex(buf: Buffer | Uint8Array | null): string {
  if (!buf) return ''
  return Buffer.from(buf).toString('hex')
}


