// Seed / adjust test dates for UT-1, UT-2, UT-3 in MySQL
// so that each test falls in a different month, and
// parent progress + attendance graphs have clear ranges.
//
// Usage (from repo root):
//   node apps/onboarding-next/scripts/seed-tests-dates.mjs

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

  // Fetch all mark sheets for UT-1..UT-3
  const [rows] = await db.query(
    `SELECT ms.id, t.name AS test, ms.date_ymd
       FROM mark_sheets ms
       JOIN tests t ON t.id = ms.test_id
      WHERE t.name IN ('UT-1','UT-2','UT-3')
      ORDER BY t.name, ms.id`,
  )

  if (!rows.length) {
    console.log('No mark_sheets found for UT-1/UT-2/UT-3. Nothing to update.')
    await db.end()
    return
  }

  // Determine an anchor date:
  //  - Prefer existing date_ymd for UT-3 if present
  //  - else any non-null date_ymd from UT-2 or UT-1
  //  - else today
  let anchorDate = null
  for (const r of rows) {
    if (r.test === 'UT-3' && r.date_ymd) {
      anchorDate = new Date(r.date_ymd)
      break
    }
  }
  if (!anchorDate) {
    const withDate = rows.find((r) => r.date_ymd)
    if (withDate) anchorDate = new Date(withDate.date_ymd)
  }
  if (!anchorDate || Number.isNaN(anchorDate.getTime())) {
    anchorDate = new Date()
  }

  const day = anchorDate.getDate()
  const baseMonth = anchorDate.getMonth() // 0-indexed
  const year = anchorDate.getFullYear()

  // Target dates:
  //   UT-3 -> anchor month (e.g. November 21)
  //   UT-2 -> anchor month - 1
  //   UT-1 -> anchor month - 2
  const dateMap = {
    'UT-3': fmtYmd(new Date(year, baseMonth, day)),
    'UT-2': fmtYmd(new Date(year, baseMonth - 1, day)),
    'UT-1': fmtYmd(new Date(year, baseMonth - 2, day)),
  }

  // Update mark_sheets.date_ymd for each test, if present
  const tests = ['UT-1', 'UT-2', 'UT-3']
  for (const name of tests) {
    const target = dateMap[name]
    const hasAny = rows.some((r) => r.test === name)
    if (!hasAny) continue
    await db.execute(
      `UPDATE mark_sheets ms
         JOIN tests t ON t.id = ms.test_id
         SET ms.date_ymd = ?
       WHERE t.name = ?`,
      [target, name],
    )
    console.log(`Set date_ymd for ${name} to ${target}`)
  }

  console.log('Done updating test dates for UT-1/UT-2/UT-3.')
  await db.end()
}

main().catch((err) => {
  console.error('Seed tests dates error:', err)
  process.exitCode = 1
})

