// Validate MySQL connectivity and required tables exist

import mysql from 'mysql2/promise'

function connOptionsFromEnv() {
  const url = process.env.DATABASE_URL || ''
  const socket = process.env.DB_SOCKET || ''
  if (socket) {
    return {
      socketPath: socket,
      user: process.env.DB_USER || 'sas_app',
      password: process.env.DB_PASSWORD || '9482824040',
      database: process.env.DB_NAME || 'sas',
      charset: 'utf8mb4_general_ci'
    }
  }
  if (url) return { uri: url }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sas_app',
    password: process.env.DB_PASSWORD || '9482824040',
    database: process.env.DB_NAME || 'sas',
    charset: 'utf8mb4_general_ci'
  }
}

const REQUIRED = [
  'classes','sections','parents','students','teachers','subjects','class_subjects','teaching_assignments',
  'attendance','attendance_entries','tests','mark_sheets','mark_entries','diaries','calendar_events','materials',
  'textbooks','pyqs','syllabus','syllabus_chapters','syllabus_subtopics','circulars','fees_catalog','invoices',
  'invoice_line_items','payments','applications','auth_users','auth_roles','auth_role_bindings'
]

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 3 })
  const [verRows] = await db.query('SELECT VERSION() AS v')
  console.log('Connected to MySQL version:', verRows[0]?.v)

  const [rows] = await db.query('SHOW TABLES')
  const have = new Set(rows.map(r => Object.values(r)[0]))
  const missing = REQUIRED.filter(t => !have.has(t))

  if (missing.length) {
    console.log('Missing tables:', missing.join(', '))
    process.exitCode = 2
  } else {
    console.log('All required tables present.')
  }
  await db.end()
}

main().catch((err) => { console.error('Validation error:', err); process.exitCode = 1 })
