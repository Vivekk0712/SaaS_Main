// Seed sample attendance, marks, diaries, calendar, and circulars
// for all classes/sections/subjects using existing students and
// per-class teachers. Idempotent.

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
    password: process.env.DB_PASSWORD || '9482824040',
    database: process.env.DB_NAME || 'sas',
    charset: 'utf8mb4_general_ci'
  }
}

const SUBJECTS = ['ENG', 'KAN', 'MAT', 'PHY', 'BIO']

function ymd(date) {
  return date.toISOString().slice(0,10)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function* lastNDays(n) {
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const dd = new Date(d)
    dd.setDate(d.getDate() - i)
    yield dd
  }
}

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 10 })

  // Resolve classes, sections, subjects ids
  const [classRows] = await db.query('SELECT id,name FROM classes')
  const [subRows] = await db.query('SELECT id,name FROM subjects')
  const subjIdByName = new Map(subRows.map(r => [r.name, r.id]))

  // Ensure tests
  for (const t of ['UT-1', 'UT-2', 'UT-3']) await db.execute('INSERT IGNORE INTO tests (name) VALUES (?)', [t])
  const [[ut1]] = await db.query('SELECT id FROM tests WHERE name=?', ['UT-1'])
  const [[ut2]] = await db.query('SELECT id FROM tests WHERE name=?', ['UT-2'])
  const [[ut3]] = await db.query('SELECT id FROM tests WHERE name=?', ['UT-3'])

  // For each class/section, seed:
  // - Attendance for last 3 days, 5 hours/day, random presence
  // - Mark sheets for UT-1 per subject with random marks
  // - Diaries for today per subject
  // - A few calendar events this month
  // - One circular per section
  for (const c of classRows) {
    const [sections] = await db.query('SELECT id,name FROM sections WHERE class_id=?', [c.id])

    for (const sec of sections) {
      const [students] = await db.query('SELECT id,usn FROM students WHERE class_id=? AND section_id=? ORDER BY usn', [c.id, sec.id])

      // Attendance
      let hourCount = 5
      for (const d of lastNDays(3)) {
        const dateStr = ymd(d)
        for (let hour = 1; hour <= hourCount; hour++) {
          // No subject binding for simplicity
          let attendanceId = null
          const [exists] = await db.query(
            'SELECT id FROM attendance WHERE ymd=? AND class_id=? AND section_id=? AND hour_no=? AND subject_id IS NULL LIMIT 1',
            [dateStr, c.id, sec.id, hour]
          )
          if (exists.length) attendanceId = exists[0].id
          if (!attendanceId) {
            const [res] = await db.execute(
              'INSERT INTO attendance (ymd, class_id, section_id, hour_no, subject_id) VALUES (?, ?, ?, ?, NULL)',
              [dateStr, c.id, sec.id, hour]
            )
            attendanceId = res.insertId
          }
          for (const s of students) {
            const present = Math.random() < 0.93
            await db.execute(
              'INSERT INTO attendance_entries (attendance_id, student_id, present) VALUES (?,?,?) ON DUPLICATE KEY UPDATE present=VALUES(present)',
              [attendanceId, s.id, present]
            )
          }
        }
      }

      // Marks for UT-1 per subject
      for (const subject of SUBJECTS) {
        const subjectId = subjIdByName.get(subject)
        if (!subjectId) continue
        const [sheetRows] = await db.query(
          'SELECT id FROM mark_sheets WHERE test_id=? AND subject_id=? AND class_id=? AND section_id=? LIMIT 1',
          [ut1.id, subjectId, c.id, sec.id]
        )
        let sheetId = sheetRows.length ? sheetRows[0].id : null
        if (!sheetId) {
          const [res] = await db.execute(
            'INSERT INTO mark_sheets (test_id, subject_id, class_id, section_id, date_ymd, max_marks) VALUES (?, ?, ?, ?, ?, ?)',
            [ut1.id, subjectId, c.id, sec.id, ymd(new Date()), 50]
          )
          sheetId = res.insertId
        }
        for (const s of students) {
          const marks = randInt(25, 50)
          await db.execute(
            'INSERT INTO mark_entries (sheet_id, student_id, marks) VALUES (?,?,?) ON DUPLICATE KEY UPDATE marks=VALUES(marks)',
            [sheetId, s.id, marks]
          )
        }
      }

      // Marks for UT-2 per subject (second unit test)
      for (const subject of SUBJECTS) {
        const subjectId = subjIdByName.get(subject)
        if (!subjectId) continue
        const [sheetRows] = await db.query(
          'SELECT id FROM mark_sheets WHERE test_id=? AND subject_id=? AND class_id=? AND section_id=? LIMIT 1',
          [ut2.id, subjectId, c.id, sec.id]
        )
        let sheetId = sheetRows.length ? sheetRows[0].id : null
        if (!sheetId) {
          const [res] = await db.execute(
            'INSERT INTO mark_sheets (test_id, subject_id, class_id, section_id, date_ymd, max_marks) VALUES (?, ?, ?, ?, ?, ?)',
            [ut2.id, subjectId, c.id, sec.id, ymd(new Date()), 50]
          )
          sheetId = res.insertId
        }
        for (const s of students) {
          // Slightly different distribution so UT‑2 is not identical to UT‑1
          const marks = randInt(20, 50)
          await db.execute(
            'INSERT INTO mark_entries (sheet_id, student_id, marks) VALUES (?,?,?) ON DUPLICATE KEY UPDATE marks=VALUES(marks)',
            [sheetId, s.id, marks]
          )
        }
      }

      // Marks for UT-3 per subject (third unit test)
      for (const subject of SUBJECTS) {
        const subjectId = subjIdByName.get(subject)
        if (!subjectId) continue
        const [sheetRows] = await db.query(
          'SELECT id FROM mark_sheets WHERE test_id=? AND subject_id=? AND class_id=? AND section_id=? LIMIT 1',
          [ut3.id, subjectId, c.id, sec.id]
        )
        let sheetId = sheetRows.length ? sheetRows[0].id : null
        if (!sheetId) {
          const [res] = await db.execute(
            'INSERT INTO mark_sheets (test_id, subject_id, class_id, section_id, date_ymd, max_marks) VALUES (?, ?, ?, ?, ?, ?)',
            [ut3.id, subjectId, c.id, sec.id, ymd(new Date()), 50]
          )
          sheetId = res.insertId
        }
        for (const s of students) {
          const marks = randInt(20, 50)
          await db.execute(
            'INSERT INTO mark_entries (sheet_id, student_id, marks) VALUES (?,?,?) ON DUPLICATE KEY UPDATE marks=VALUES(marks)',
            [sheetId, s.id, marks]
          )
        }
      }

      // Diaries for today per subject
      for (const subject of SUBJECTS) {
        const subjectId = subjIdByName.get(subject)
        if (!subjectId) continue
        const [dup] = await db.query(
          'SELECT id FROM diaries WHERE ymd=? AND class_id=? AND section_id=? AND subject_id=? LIMIT 1',
          [ymd(new Date()), c.id, sec.id, subjectId]
        )
        if (!dup.length) {
          // Find teacher for this class/section/subject from teaching assignments
          const [trows] = await db.query(
            `SELECT t.id AS id
               FROM teaching_assignments ta
               JOIN teachers t ON t.id = ta.teacher_id
              WHERE ta.class_id=? AND ta.section_id=? AND ta.subject_id=?
              LIMIT 1`,
            [c.id, sec.id, subjectId]
          )
          const tid = trows.length ? trows[0].id : null
          await db.execute(
            'INSERT INTO diaries (ymd, class_id, section_id, subject_id, teacher_id, note, attachments) VALUES (?,?,?,?,?,?,NULL)',
            [ymd(new Date()), c.id, sec.id, subjectId, tid, `Homework: Practice ${subject} ch.${randInt(1,5)}`]
          )
        }
      }

      // Circulars (one per section)
      const [cdup] = await db.query(
        'SELECT id FROM circulars WHERE ymd=? AND class_id=? AND section_id=? LIMIT 1',
        [ymd(new Date()), c.id, sec.id]
      )
      if (!cdup.length) {
        await db.execute(
          'INSERT INTO circulars (title, body, ymd, class_id, section_id, created_by, color, attachments) VALUES (?,?,?,?,?,?,?,NULL)',
          ['Welcome Back', `Welcome to ${c.name} ${sec.name}!`, ymd(new Date()), c.id, sec.id, null, 'blue']
        )
      }
    }

    // Calendar events (per class)
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    for (const [offset, pair] of [[3,'PTM'], [10,'Sports Day'], [20,'Unit Test']].entries()) {
      const d = new Date(monthStart)
      d.setDate(monthStart.getDate() + (offset * 1))
      const [exists] = await db.query('SELECT id FROM calendar_events WHERE ymd=? AND title=? LIMIT 1', [ymd(d), String(pair)])
      if (!exists.length) {
        await db.execute(
          'INSERT INTO calendar_events (ymd, title, tag, color, description) VALUES (?,?,?,?,?)',
          [ymd(d), String(pair), String(pair), 'green', `${pair} for ${c.name}`]
        )
      }
    }
  }

  console.log('Seeded academics data (attendance, marks, diaries, calendar, circulars).')
  await db.end()
}

main().catch((err) => { console.error('Seed academics error:', err); process.exitCode = 1 })
