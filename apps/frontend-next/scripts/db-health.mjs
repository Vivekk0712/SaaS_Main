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

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 5 })
  const [[ver]] = await db.query('SELECT VERSION() AS version')
  console.log('MySQL version:', ver.version)

  const tables = [
    'classes','sections','subjects','teachers','class_subjects','teaching_assignments',
    'parents','students','auth_users','auth_roles','auth_role_bindings',
    'attendance','attendance_entries','tests','mark_sheets','mark_entries',
    'diaries','calendar_events','invoices','invoice_line_items','applications'
  ]
  for (const t of tables) {
    const [[row]] = await db.query(`SELECT COUNT(*) AS c FROM ${t}`)
    console.log(`${t}:`, row.c)
  }

  // Check deterministic mapping for first parent phone → expected student
  const phone = '9000000001'
  const [[p]] = await db.query('SELECT id,name FROM parents WHERE phone=?', [phone])
  console.log('Parent 9000000001:', p || null)
  // Guardian link
  const [stByGuardian] = await db.query(
    `SELECT s.usn, s.name, c.name AS klass, sec.name AS section
       FROM students s JOIN classes c ON c.id=s.class_id JOIN sections sec ON sec.id=s.section_id
      WHERE s.guardian_id=? ORDER BY c.name, sec.name, s.usn LIMIT 5`, [p?.id || 0]
  )
  console.log('Students by guardian (first 5):', stByGuardian)
  // Fallback mapping check
  const map = (() => {
    const base = 9000000000n
    const phoneBn = BigInt(phone)
    const serial = phoneBn - base
    const t = serial - 1n
    const groupIndex = Number(t / 30n)
    const c = Math.floor(groupIndex / 2) + 1
    const sIdx = groupIndex % 2
    const r = Number(t % 30n) + 1
    const section = sIdx === 0 ? 'A' : 'B'
    const usn = `${c}${section}${String(r).padStart(2,'0')}`
    const klass = `CLASS ${c}`
    return { usn, klass, section }
  })()
  const [[st]] = await db.query(
    `SELECT s.usn, s.name, c.name AS klass, sec.name AS section
       FROM students s JOIN classes c ON c.id=s.class_id JOIN sections sec ON sec.id=s.section_id
      WHERE s.usn=? AND c.name=? AND sec.name=? LIMIT 1`,
    [map.usn, map.klass, map.section]
  )
  console.log('Fallback mapped student:', st || null)

  // Parent auth user hash check
  const [[au]] = await db.query('SELECT email, HEX(password_hash) AS hex FROM auth_users WHERE email=? LIMIT 1', [phone])
  console.log('Auth user:', au || null)

  await db.end()
}

main().catch((err) => { console.error('DB health error:', err); process.exitCode = 1 })
