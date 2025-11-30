// Import local JSON data into MySQL schema defined in docs/mysql-database.md
// Idempotent: uses unique keys and lookups to avoid duplicates.

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
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

function parseHour(str) {
  const n = Number(str)
  return Number.isFinite(n) ? n : null
}

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 5 })
  const repoRoot = path.resolve(__dirname, '../../../')
  const jsonPath = path.join(repoRoot, 'data', 'local-db.json')
  const text = await fs.readFile(jsonPath, 'utf8')
  const data = JSON.parse(text)

  // Helpers
  async function ensureClass(name) {
    const [rows] = await db.query('SELECT id FROM classes WHERE name = ? LIMIT 1', [name])
    if (rows.length) return rows[0].id
    const [res] = await db.execute('INSERT INTO classes (name) VALUES (?)', [name])
    return res.insertId
  }

  async function ensureSection(classId, name) {
    const [rows] = await db.query('SELECT id FROM sections WHERE class_id = ? AND name = ? LIMIT 1', [classId, name])
    if (rows.length) return rows[0].id
    const [res] = await db.execute('INSERT INTO sections (class_id, name) VALUES (?, ?)', [classId, name])
    return res.insertId
  }

  async function ensureParent(phone, name = null, email = null) {
    const [rows] = await db.query('SELECT id FROM parents WHERE phone = ? LIMIT 1', [phone])
    if (rows.length) return rows[0].id
    const [res] = await db.execute('INSERT INTO parents (name, phone, email) VALUES (?, ?, ?)', [name || phone, phone, email])
    return res.insertId
  }

  async function ensureSubject(name) {
    const [rows] = await db.query('SELECT id FROM subjects WHERE name = ? LIMIT 1', [name])
    if (rows.length) return rows[0].id
    const [res] = await db.execute('INSERT INTO subjects (name) VALUES (?)', [name])
    return res.insertId
  }

  async function ensureTeacher(name) {
    if (!name) return null
    const [rows] = await db.query('SELECT id FROM teachers WHERE name = ? LIMIT 1', [name])
    if (rows.length) return rows[0].id
    const [res] = await db.execute('INSERT INTO teachers (name) VALUES (?)', [name])
    return res.insertId
  }

  async function ensureStudent({ roll, name, klass, section, guardianPhone }) {
    // Ensure class/section
    const classId = await ensureClass(klass)
    const sectionId = await ensureSection(classId, section)
    // Ensure parent
    let guardianId = null
    if (guardianPhone) guardianId = await ensureParent(guardianPhone)
    // Lookup student
    const [rows] = await db.query('SELECT id FROM students WHERE usn = ? LIMIT 1', [roll])
    if (rows.length) return rows[0].id
    const [res] = await db.execute(
      'INSERT INTO students (usn, name, class_id, section_id, status, guardian_id) VALUES (?, ?, ?, ?, "active", ?)',
      [roll, name, classId, sectionId, guardianId]
    )
    return res.insertId
  }

  async function ensureClassSubject(klass, section, subject) {
    const classId = await ensureClass(klass)
    const sectionId = await ensureSection(classId, section)
    const subjectId = await ensureSubject(subject)
    await db.execute(
      'INSERT IGNORE INTO class_subjects (class_id, section_id, subject_id) VALUES (?, ?, ?)',
      [classId, sectionId, subjectId]
    )
  }

  async function ensureTest(name) {
    const [rows] = await db.query('SELECT id FROM tests WHERE name = ? LIMIT 1', [name])
    if (rows.length) return rows[0].id
    const [res] = await db.execute('INSERT INTO tests (name) VALUES (?)', [name])
    return res.insertId
  }

  async function upsertAttendance({ ymd, klass, section, hour, subject, map }) {
    const classId = await ensureClass(klass)
    const sectionId = await ensureSection(classId, section)
    const subjectId = subject ? await ensureSubject(subject) : null
    // find or create attendance slot
    let attendanceId = null
    {
      let rows
      if (subjectId == null) {
        ;[rows] = await db.query(
          'SELECT id FROM attendance WHERE ymd = ? AND class_id = ? AND section_id = ? AND hour_no = ? AND subject_id IS NULL LIMIT 1',
          [ymd, classId, sectionId, hour]
        )
      } else {
        ;[rows] = await db.query(
          'SELECT id FROM attendance WHERE ymd = ? AND class_id = ? AND section_id = ? AND hour_no = ? AND subject_id = ? LIMIT 1',
          [ymd, classId, sectionId, hour, subjectId]
        )
      }
      if (rows.length) attendanceId = rows[0].id
    }
    if (!attendanceId) {
      const [res] = await db.execute(
        'INSERT INTO attendance (ymd, class_id, section_id, hour_no, subject_id) VALUES (?, ?, ?, ?, ?)',
        [ymd, classId, sectionId, hour, subjectId]
      )
      attendanceId = res.insertId
    }
    // entries
    for (const [roll, present] of Object.entries(map || {})) {
      const [stRows] = await db.query('SELECT id FROM students WHERE usn = ? LIMIT 1', [roll])
      if (!stRows.length) continue
      const studentId = stRows[0].id
      await db.execute(
        'INSERT INTO attendance_entries (attendance_id, student_id, present) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE present = VALUES(present)',
        [attendanceId, studentId, !!present]
      )
    }
  }

  async function upsertMarkSheet({ test, subject, klass, section, date, max, marks, createdBy }) {
    const testId = await ensureTest(test)
    const subjectId = await ensureSubject(subject)
    const classId = await ensureClass(klass)
    const sectionId = await ensureSection(classId, section)
    // find or create sheet
    let sheetId = null
    {
      const [rows] = await db.query(
        'SELECT id FROM mark_sheets WHERE test_id = ? AND subject_id = ? AND class_id = ? AND section_id = ? LIMIT 1',
        [testId, subjectId, classId, sectionId]
      )
      if (rows.length) sheetId = rows[0].id
    }
    if (!sheetId) {
      const [res] = await db.execute(
        'INSERT INTO mark_sheets (test_id, subject_id, class_id, section_id, date_ymd, max_marks) VALUES (?, ?, ?, ?, ?, ?)',
        [testId, subjectId, classId, sectionId, date || null, max || 0]
      )
      sheetId = res.insertId
    }
    // entries
    for (const [roll, score] of Object.entries(marks || {})) {
      const [stRows] = await db.query('SELECT id FROM students WHERE usn = ? LIMIT 1', [roll])
      if (!stRows.length) continue
      const studentId = stRows[0].id
      await db.execute(
        'INSERT INTO mark_entries (sheet_id, student_id, marks) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE marks = VALUES(marks)',
        [sheetId, studentId, Number(score)]
      )
    }
  }

  async function upsertDiary({ ymd, klass, section, subject, teacher, note, attachments }) {
    const classId = await ensureClass(klass)
    const sectionId = await ensureSection(classId, section)
    const subjectId = await ensureSubject(subject)
    const teacherId = await ensureTeacher(teacher)
    // Check similar entry to avoid obvious duplicates
    const [rows] = await db.query(
      'SELECT id FROM diaries WHERE ymd=? AND class_id=? AND section_id=? AND subject_id=? AND note=? LIMIT 1',
      [ymd, classId, sectionId, subjectId, note]
    )
    if (rows.length) return
    await db.execute(
      'INSERT INTO diaries (ymd, class_id, section_id, subject_id, teacher_id, note, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ymd, classId, sectionId, subjectId, teacherId, note, attachments ? JSON.stringify(attachments) : null]
    )
  }

  async function upsertCalendarEvent({ ymd, title, tag, color, description, createdBy }) {
    // No unique constraint; insert if a very similar event doesn’t already exist
    const [rows] = await db.query(
      'SELECT id FROM calendar_events WHERE ymd=? AND title=? AND tag=? LIMIT 1',
      [ymd, title, tag]
    )
    if (rows.length) return
    await db.execute(
      'INSERT INTO calendar_events (ymd, title, tag, color, description) VALUES (?, ?, ?, ?, ?)',
      [ymd, title, tag || 'event', color || 'blue', description || null]
    )
  }

  async function upsertCircular({ ymd, klass, section, title, body, color, attachments, createdBy }) {
    const classId = await ensureClass(klass)
    const sectionId = await ensureSection(classId, section)
    // Avoid duplicates by title/date/class/section
    const [rows] = await db.query(
      'SELECT id FROM circulars WHERE ymd=? AND class_id=? AND section_id=? AND title=? LIMIT 1',
      [ymd, classId, sectionId, title]
    )
    if (rows.length) return
    const teacherId = await ensureTeacher(createdBy)
    await db.execute(
      'INSERT INTO circulars (title, body, ymd, class_id, section_id, created_by, color, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, body || '', ymd, classId, sectionId, teacherId, color || null, attachments ? JSON.stringify(attachments) : null]
    )
  }

  async function upsertApplication(app) {
    const applicantName = `${app?.data?.student?.firstName || ''} ${app?.data?.student?.lastName || ''}`.trim() || app?.id || 'Applicant'
    const parentPhone = app?.parentPhone || null
    const grade = app?.data?.admission?.grade || null
    const sectionPref = app?.data?.admission?.section || null
    const status = app?.status || 'submitted'
    // crude de-dupe: same parentPhone + grade + createdAt minute
    const createdAt = app?.createdAt ? new Date(app.createdAt) : null
    const ymd = createdAt ? createdAt.toISOString().slice(0, 16) : null
    if (parentPhone) await ensureParent(parentPhone)
    const [rows] = await db.query(
      'SELECT id FROM applications WHERE applicant_name=? AND grade_applied=? AND status=? LIMIT 1',
      [applicantName, grade, status]
    )
    if (!rows.length) {
      await db.execute(
        'INSERT INTO applications (applicant_name, parent_phone, grade_applied, section_pref, status, data_json) VALUES (?, ?, ?, ?, ?, ?)',
        [applicantName, parentPhone, grade, sectionPref, status, JSON.stringify(app?.data || {})]
      )
    }
  }

  async function upsertInvoice({ studentId, items, total, status, createdAt }) {
    const st = status === 'paid' ? 'paid' : (status === 'void' ? 'void' : 'pending')
    const [res] = await db.execute(
      'INSERT INTO invoices (student_id, total, currency, status, due_at) VALUES (?, ?, "INR", ?, NULL)',
      [studentId, total || 0, st]
    )
    const invId = res.insertId
    let pos = 0
    for (const it of (items || [])) {
      await db.execute(
        'INSERT INTO invoice_line_items (invoice_id, label, amount, position) VALUES (?, ?, ?, ?)',
        [invId, it.label || 'Item', Number(it.amount || 0), pos++]
      )
    }
  }

  // 1) Parents (root + profiles)
  if (Array.isArray(data.parents)) {
    for (const p of data.parents) {
      await ensureParent(p.phone, p.parentName || p.name || p.phone)
    }
  }
  if (data?.profiles?.parents) {
    for (const p of data.profiles.parents) {
      await ensureParent(p.phone, p.parentName || p.name || p.phone)
    }
  }

  // 2) Students (profiles)
  if (data?.profiles?.students) {
    for (const s of data.profiles.students) {
      await ensureStudent({
        roll: s.roll,
        name: s.name,
        klass: s.grade,
        section: s.section,
        guardianPhone: s.fatherPhone
      })
    }
  }

  // 3) Class subjects (academics.classSubjects)
  if (data?.academics?.classSubjects) {
    for (const [klassSection, list] of Object.entries(data.academics.classSubjects)) {
      const [klass, section] = String(klassSection).split('|')
      for (const subj of list || []) {
        await ensureClassSubject(klass, section, subj)
      }
    }
  }

  // 4) Attendance
  if (data?.attendance) {
    for (const [key, map] of Object.entries(data.attendance)) {
      const [ymd, klass, section, hourStr] = String(key).split('|')
      const hour = parseHour(hourStr)
      await upsertAttendance({ ymd, klass, section, hour, subject: null, map })
    }
  }

  // 5) Marks
  if (Array.isArray(data.marks)) {
    for (const m of data.marks) {
      await upsertMarkSheet({
        test: m.test,
        subject: m.subject,
        klass: m.klass,
        section: m.section,
        date: m.date,
        max: m.max,
        marks: m.marks,
        createdBy: m.createdBy
      })
    }
  }

  // 6) Diaries
  if (data?.diary) {
    for (const [date, entries] of Object.entries(data.diary)) {
      for (const d of entries || []) {
        await upsertDiary({
          ymd: date,
          klass: d.klass,
          section: d.section,
          subject: d.subject,
          teacher: d.teacher,
          note: d.note,
          attachments: d.attachments || null
        })
      }
    }
  }

  // 7) Calendar
  if (data?.calendar) {
    for (const [date, events] of Object.entries(data.calendar)) {
      for (const ev of events || []) {
        await upsertCalendarEvent({
          ymd: date,
          title: ev.title,
          tag: ev.tag,
          color: ev.color,
          description: ev.description,
          createdBy: ev.createdBy
        })
      }
    }
  }

  // 8) Circulars
  if (Array.isArray(data.circulars)) {
    for (const c of data.circulars) {
      await upsertCircular({
        ymd: c.date || c.ymd,
        klass: c.klass,
        section: c.section,
        title: c.title,
        body: c.body,
        color: c.color,
        attachments: c.attachments || null,
        createdBy: c.createdBy
      })
    }
  }

  // 9) Applications
  if (Array.isArray(data.applications)) {
    for (const app of data.applications) {
      await upsertApplication(app)
    }
  }

  // 10) Ad‑hoc bills and Fees -> invoices
  if (Array.isArray(data.adhocBills)) {
    for (const b of data.adhocBills) {
      // Try to locate student by name + parentPhone
      let studentId = null
      if (data?.profiles?.students) {
        const match = data.profiles.students.find(s => s.name === b.name && s.fatherPhone === b.parentPhone)
        if (match) {
          const [rows] = await db.query('SELECT id FROM students WHERE usn = ? LIMIT 1', [match.roll])
          if (rows.length) studentId = rows[0].id
        }
      }
      if (!studentId) {
        // As a fallback, skip if no student link can be established
        continue
      }
      await upsertInvoice({
        studentId,
        items: b.items,
        total: b.total,
        status: b.status,
        createdAt: b.createdAt
      })
    }
  }

  // 11) Fees (by application) -> try to create invoices when student exists
  if (Array.isArray(data.fees)) {
    for (const f of data.fees) {
      const app = (data.applications || []).find(a => a.id === f.appId)
      let studentId = null
      if (app && data?.profiles?.students) {
        const grade = app?.data?.admission?.grade
        const parentPhone = app?.parentPhone
        const match = data.profiles.students.find(s => s.fatherPhone === parentPhone && s.grade === `CLASS ${grade}`)
        if (match) {
          const [rows] = await db.query('SELECT id FROM students WHERE usn = ? LIMIT 1', [match.roll])
          if (rows.length) studentId = rows[0].id
        }
      }
      if (!studentId) continue
      await upsertInvoice({ studentId, items: f.items, total: f.total, status: 'pending', createdAt: f.updatedAt })
    }
  }

  await db.end()
  console.log('ETL import completed successfully.')
}

main().catch((err) => {
  console.error('ETL error:', err)
  process.exitCode = 1
})
