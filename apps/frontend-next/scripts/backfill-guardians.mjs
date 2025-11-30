// Backfill students.guardian_id by mapping seeded parent phone -> expected student USN
// Works with the dummy seeding scheme (classes 1..10, sections A/B, 30 students each).

import mysql from 'mysql2/promise'

function connOptionsFromEnv() {
  const url = process.env.DATABASE_URL || ''
  const socket = process.env.DB_SOCKET || ''
  if (socket) {
    return {
      socketPath: socket,
      user: process.env.DB_USER || 'sas_app',
      password: process.env.DB_PASSWORD || 'Vinayaka@464',
      database: process.env.DB_NAME || 'sas',
      charset: 'utf8mb4_general_ci'
    }
  }
  if (url) return { uri: url }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sas_app',
    password: process.env.DB_PASSWORD || 'Vinayaka@464',
    database: process.env.DB_NAME || 'sas',
    charset: 'utf8mb4_general_ci'
  }
}

function invMapFromPhone(phoneStr) {
  const base = 9000000000n
  const phone = BigInt(phoneStr)
  const serial = phone - base // 1..600
  if (serial < 1n) return null
  const t = serial - 1n
  const groupIndex = Number(t / 30n) // 0..19 for 10 classes * 2 sections
  const c = Math.floor(groupIndex / 2) + 1 // 1..10
  const sIdx = groupIndex % 2 // 0->A, 1->B
  const r = Number(t % 30n) + 1 // 1..30
  const section = sIdx === 0 ? 'A' : 'B'
  const usn = `${c}${section}${String(r).padStart(2,'0')}`
  const klass = `CLASS ${c}`
  return { klass, section, usn }
}

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 5 })
  const [parents] = await db.query('SELECT id, phone FROM parents ORDER BY id ASC')
  let updated = 0
  for (const p of parents) {
    const map = invMapFromPhone(String(p.phone))
    if (!map) continue
    const [[cls]] = await db.query('SELECT id FROM classes WHERE name=?', [map.klass])
    const [[sec]] = await db.query('SELECT id FROM sections WHERE class_id=? AND name=?', [cls?.id || 0, map.section])
    if (!cls || !sec) continue
    const [[stu]] = await db.query('SELECT usn, guardian_id FROM students WHERE usn=? AND class_id=? AND section_id=? LIMIT 1', [map.usn, cls.id, sec.id])
    if (!stu) continue
    if (stu.guardian_id !== p.id) {
      await db.execute('UPDATE students SET guardian_id=? WHERE usn=? AND class_id=? AND section_id=?', [p.id, map.usn, cls.id, sec.id])
      updated++
    }
  }
  console.log(`Backfill complete. Updated ${updated} student guardian links.`)
  await db.end()
}

main().catch((err) => { console.error('Backfill error:', err); process.exitCode = 1 })

