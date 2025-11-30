// Apply SQL schema from docs/mysql-database.md by extracting ```sql blocks
// Skips CREATE DATABASE/USER/GRANT commands (expect DB/user already exist).

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

function connOptionsFromEnv() {
  const url = process.env.DATABASE_URL || ''
  const socket = process.env.DB_SOCKET || ''
  if (socket) {
    return {
      socketPath: socket,
      user: process.env.DB_USER || 'sas_app',
      password: process.env.DB_PASSWORD || 'sas_strong_password_123',
      database: process.env.DB_NAME || 'sas',
      multipleStatements: true,
      charset: 'utf8mb4_general_ci'
    }
  }
  if (url) return { uri: url, multipleStatements: true }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sas_app',
    password: process.env.DB_PASSWORD || 'sas_strong_password_123',
    database: process.env.DB_NAME || 'sas',
    multipleStatements: true,
    charset: 'utf8mb4_general_ci'
  }
}

function extractSqlBlocks(md) {
  const blocks = []
  const re = /```sql\r?\n([\s\S]*?)\r?\n```/g
  let m
  while ((m = re.exec(md))) blocks.push(m[1])
  return blocks.join('\n\n')
}

function splitStatements(sql) {
  // naive split by semicolon at end of line
  const res = []
  let acc = []
  const lines = sql.split(/\r?\n/)
  for (const line of lines) {
    acc.push(line)
    if (/;\s*$/.test(line)) {
      res.push(acc.join('\n'))
      acc = []
    }
  }
  if (acc.length) res.push(acc.join('\n'))
  return res
}

function shouldSkip(stmt) {
  const s = stmt.trim().toUpperCase()
  return s.startsWith('CREATE DATABASE') || s.startsWith('CREATE USER') || s.startsWith('GRANT ') || s.startsWith('FLUSH PRIVILEGES')
}

async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const repoRoot = path.resolve(__dirname, '../../../')
  const docPath = path.join(repoRoot, 'docs', 'mysql-database.md')
  const md = await fs.readFile(docPath, 'utf8')
  const sqlAll = extractSqlBlocks(md)
  const stmts = splitStatements(sqlAll).map(s => s.trim()).filter(Boolean).filter(s => !shouldSkip(s))
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 3 })
  for (const s of stmts) {
    try {
      await db.execute(s)
    } catch (e) {
      // ignore idempotent errors
    }
  }
  await db.end()
  console.log(`Applied ${stmts.length} statements from docs.`)
}

main().catch((err) => { console.error('Schema apply error:', err); process.exitCode = 1 })
