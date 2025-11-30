// Seed default classes/sections/subjects/tests into MySQL
// Safe to run multiple times.

import mysql from 'mysql2/promise'

function connOptionsFromEnv() {
  const url = process.env.DATABASE_URL || ''
  const socket = process.env.DB_SOCKET || ''
  if (socket) {
    return {
      socketPath: socket,
      user: process.env.DB_USER || 'sas_app',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sas',
      charset: 'utf8mb4_general_ci'
    }
  }
  if (url) return { uri: url }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sas_app',
    password: process.env.DB_PASSWORD || 'sas_strong_password_123',
    database: process.env.DB_NAME || 'sas',
    charset: 'utf8mb4_general_ci'
  }
}

async function ensure(db, sql, params = []) {
  await db.execute(sql, params)
}

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 5 })

  const classes = Array.from({ length: 10 }).map((_, i) => `CLASS ${i + 1}`)
  const sections = ['A', 'B', 'C']
  const subjects = ['ENG', 'KAN', 'MAT', 'PHY', 'BIO']
  const tests = ['UT-1', 'UT-2', 'UT-3', 'MID', 'FINAL']

  for (const c of classes) {
    await ensure(db, 'INSERT IGNORE INTO classes (name) VALUES (?)', [c])
  }

  for (const c of classes) {
    const [[cls]] = await db.query('SELECT id FROM classes WHERE name=?', [c])
    if (!cls) continue
    for (const s of sections) {
      await ensure(db, 'INSERT IGNORE INTO sections (class_id, name) VALUES (?, ?)', [cls.id, s])
    }
  }

  for (const s of subjects) {
    await ensure(db, 'INSERT IGNORE INTO subjects (name) VALUES (?)', [s])
  }

  for (const t of tests) {
    await ensure(db, 'INSERT IGNORE INTO tests (name) VALUES (?)', [t])
  }

  console.log('Seed completed.')
  await db.end()
}

main().catch((err) => { console.error(err); process.exitCode = 1 })
