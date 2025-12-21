// Seed dummy attendance data for all active students into MySQL
// Usage:
//   node apps/onboarding-next/scripts/seed-attendance.mjs
//
// This will create present/absent data for the last ~3 months
// (weekdays only, hours 1–5) for every active student in the
// students table. It is safe to run multiple times; existing
// slots are updated, not duplicated.

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
      charset: 'utf8mb4_general_ci',
    }
  }
  if (url) return { uri: url }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sas_app',
    password: process.env.DB_PASSWORD || 'sas_strong_password_123',
    database: process.env.DB_NAME || 'sas',
    charset: 'utf8mb4_general_ci',
  }
}

function fmtYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 10 })

  // 1) Load all active students with their class/section IDs
  const [rows] = await db.query(
    `SELECT s.id AS student_id, s.usn, s.class_id, s.section_id
       FROM students s
      WHERE s.status = 'active'`,
  )

  if (!rows.length) {
    console.log('No active students found; nothing to seed.')
    await db.end()
    return
  }

  // Group students by class/section
  const groups = new Map()
  for (const r of rows) {
    const key = `${r.class_id}|${r.section_id}`
    if (!groups.has(key)) {
      groups.set(key, {
        classId: r.class_id,
        sectionId: r.section_id,
        studentIds: [],
      })
    }
    groups.get(key).studentIds.push(r.student_id)
  }

  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end)
  start.setMonth(start.getMonth() - 3)

  const HOURS = [1, 2, 3, 4, 5]
  let totalSlots = 0
  let totalEntries = 0

  console.log(
    `Seeding attendance from ${fmtYmd(start)} to ${fmtYmd(
      end,
    )} for ${rows.length} students in ${groups.size} class/sections...`,
  )

  const cursor = new Date(start)
  while (cursor <= end) {
    const dow = cursor.getDay() // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) {
      const ymd = fmtYmd(cursor)
      for (const { classId, sectionId, studentIds } of groups.values()) {
        if (!studentIds.length) continue
        for (const hour of HOURS) {
          // Check if a slot already exists
          const [existing] = await db.query(
            'SELECT id FROM attendance WHERE ymd=? AND class_id=? AND section_id=? AND hour_no=? AND subject_id IS NULL LIMIT 1',
            [ymd, classId, sectionId, hour],
          )

          let attId
          if (existing.length) {
            attId = existing[0].id
            // Clear old entries so re-run is idempotent
            await db.execute('DELETE FROM attendance_entries WHERE attendance_id=?', [attId])
          } else {
            const [res] = await db.execute(
              'INSERT INTO attendance (ymd, class_id, section_id, hour_no, subject_id) VALUES (?,?,?,?,NULL)',
              [ymd, classId, sectionId, hour],
            )
            attId = res.insertId
          }

          totalSlots += 1

          const placeholders = []
          const values = []
          for (const sid of studentIds) {
            const present = Math.random() < 0.9 // ~90% present
            placeholders.push('(?,?,?)')
            values.push(attId, sid, present ? 1 : 0)
            totalEntries += 1
          }

          if (placeholders.length) {
            await db.execute(
              `INSERT INTO attendance_entries (attendance_id, student_id, present) VALUES ${placeholders.join(
                ',',
              )}`,
              values,
            )
          }
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  console.log(
    `Done. Seeded ${totalSlots} attendance slots and ${totalEntries} entries for dates ${fmtYmd(
      start,
    )} to ${fmtYmd(end)}.`,
  )

  await db.end()
}

main().catch((err) => {
  console.error('Seed attendance error:', err)
  process.exitCode = 1
})

