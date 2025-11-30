// Seed 10 classes (CLASS 1..10), sections A/B, 5 subjects,
// unique 5 teachers per class (one per subject),
// and 30 students per class-section (600 total). Idempotent.

import mysql from 'mysql2/promise'
import fs from 'node:fs/promises'
import path from 'node:path'

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

// Simple human name pools for dummy data
const FIRST_NAMES = [
  'Aarav','Ananya','Rahul','Priya','Vikram','Sneha','Karthik','Divya','Rohan','Meera',
  'Ishaan','Lakshmi','Aditya','Nisha','Manoj','Pooja','Sanjay','Kavya','Arjun','Ritu'
]
const LAST_NAMES = [
  'Sharma','Patil','Reddy','Iyer','Gupta','Nair','Shetty','Kulkarni','Verma','Gowda',
  'Jain','Rao','Menon','Desai','Choudhary','Bhat','Singh','Joshi','Kumar','Naik'
]

function pick(arr, index) {
  return arr[index % arr.length]
}

function pad2(n) { return String(n).padStart(2, '0') }

async function ensure(db, sql, params = []) { await db.execute(sql, params) }

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 10 })

  // 1) Ensure classes/sections/subjects
  for (let c = 1; c <= 10; c++) {
    await ensure(db, 'INSERT IGNORE INTO classes (name) VALUES (?)', [`CLASS ${c}`])
    const [[cls]] = await db.query('SELECT id FROM classes WHERE name=?', [`CLASS ${c}`])
    for (const sec of ['A', 'B']) {
      await ensure(db, 'INSERT IGNORE INTO sections (class_id, name) VALUES (?, ?)', [cls.id, sec])
    }
  }
  for (const s of SUBJECTS) await ensure(db, 'INSERT IGNORE INTO subjects (name) VALUES (?)', [s])

  // 2) Class-subjects, Teachers (unique per class), and teaching assignments
  for (let c = 1; c <= 10; c++) {
    const [clsRows] = await db.query('SELECT id FROM classes WHERE name=?', [`CLASS ${c}`])
    const cls = clsRows[0]
    // Ensure class-specific teachers (one per subject)
    const teacherIdBySubject = new Map()
    for (const [idx, subject] of SUBJECTS.entries()) {
      const first = pick(FIRST_NAMES, c * SUBJECTS.length + idx)
      const last = pick(LAST_NAMES, idx * 7 + c)
      const tname = `${first} ${last}`
      // Look for any existing teacher already assigned to this class+subject
      const [assignedRows] = await db.query(
        `SELECT t.id AS id
           FROM teaching_assignments ta
           JOIN teachers t ON t.id = ta.teacher_id
           JOIN subjects s ON s.id = ta.subject_id
          WHERE ta.class_id=? AND s.name=? 
          LIMIT 1`,
        [cls.id, subject]
      )
      let tid
      if (assignedRows.length) {
        tid = assignedRows[0].id
        // Refresh teacher name to current dummy label
        await db.execute('UPDATE teachers SET name=? WHERE id=?', [tname, tid])
      } else {
        const [res] = await db.execute('INSERT INTO teachers (name) VALUES (?)', [tname])
        tid = res.insertId
      }
      teacherIdBySubject.set(subject, tid)
    }
    for (const sec of ['A', 'B']) {
      const [secRows] = await db.query('SELECT id FROM sections WHERE class_id=? AND name=?', [cls.id, sec])
      const secRow = secRows[0]
      for (const subject of SUBJECTS) {
        const [subjRows] = await db.query('SELECT id FROM subjects WHERE name=?', [subject])
        const subj = subjRows[0]
        await ensure(db, 'INSERT IGNORE INTO class_subjects (class_id, section_id, subject_id) VALUES (?,?,?)', [cls.id, secRow.id, subj.id])
        const teacherId = teacherIdBySubject.get(subject)
        await ensure(db, 'INSERT IGNORE INTO teaching_assignments (teacher_id, class_id, section_id, subject_id) VALUES (?,?,?,?)', [teacherId, cls.id, secRow.id, subj.id])
      }
    }
  }

  // 4) Parents and Students
  const basePhone = 9000000000n
  for (let c = 1; c <= 10; c++) {
    for (const [sIdx, sec] of ['A','B'].entries()) {
      const grade = `CLASS ${c}`
      const [clsRows] = await db.query('SELECT id FROM classes WHERE name=?', [grade])
      const cls = clsRows[0]
      const [secRows] = await db.query('SELECT id FROM sections WHERE class_id=? AND name=?', [cls.id, sec])
      const secRow = secRows[0]
      for (let r = 1; r <= 30; r++) {
        const serial = BigInt(((c-1)*2 + sIdx)*30 + r)
        const phone = String(basePhone + serial)
        const parentFirst = pick(FIRST_NAMES, c * 60 + r + sIdx * 5)
        const parentLast = pick(LAST_NAMES, r + c * 3 + sIdx)
        const parentName = `${parentFirst} ${parentLast}`
        const [parentRows] = await db.query('SELECT id,name FROM parents WHERE phone=?', [phone])
        let p = parentRows[0]
        if (!p) {
          const [res] = await db.execute('INSERT INTO parents (name, phone, email) VALUES (?, ?, NULL)', [parentName, phone])
          p = { id: res.insertId, name: parentName }
        } else if (String(p.name || '') !== parentName) {
          // Update existing parent to use the new dummy name
          await db.execute('UPDATE parents SET name=? WHERE id=?', [parentName, p.id])
        }
        const usn = `${c}${sec}${pad2(r)}`
        const studentFirst = pick(FIRST_NAMES, r + c * 11 + sIdx * 13)
        const studentLast = pick(LAST_NAMES, c * 17 + r + sIdx)
        const studentName = `${studentFirst} ${studentLast}`
        const [studentRows] = await db.query('SELECT id,name FROM students WHERE usn=?', [usn])
        let srow = studentRows[0]
        if (!srow) {
          const [res] = await db.execute(
            'INSERT INTO students (usn, name, class_id, section_id, status, guardian_id) VALUES (?, ?, ?, ?, "active", ?)',
            [usn, studentName, cls.id, secRow.id, p.id]
          )
          srow = { id: res.insertId, name: studentName }
        } else if (String(srow.name || '') !== studentName) {
          // Update existing student to use the new dummy name
          await db.execute('UPDATE students SET name=? WHERE id=?', [studentName, srow.id])
        }
      }
    }
  }

  // 5) Write dummy details to docs/dummy.md for convenience
  let md = []
  md.push('# Dummy Data (MySQL)')
  md.push('')
  md.push('- Classes: CLASS 1..10')
  md.push('- Sections per class: A, B')
  md.push('- Students per (class,section): 30 (total 600)')
  md.push('- Subjects: ENG, KAN, MAT, PHY, BIO')
  md.push('- Teachers: 5 per class (unique per class, one per subject; sample Indian names used)')
  md.push('')
  md.push('### Teachers by Class')
  for (let c = 1; c <= 10; c++) {
    const teacherLines = SUBJECTS.map((subject, idx) => {
      const first = pick(FIRST_NAMES, c * SUBJECTS.length + idx)
      const last = pick(LAST_NAMES, idx * 7 + c)
      const tname = `${first} ${last}`
      return `${subject}: ${tname}`
    })
    md.push(`- CLASS ${c}: ${teacherLines.join(', ')}`)
  }
  md.push('')
  for (let c = 1; c <= 10; c++) {
    md.push(`## CLASS ${c}`)
    for (const [sIdx, sec] of ['A','B'].entries()) {
      md.push(`### Section ${sec}`)
      md.push('USN | Student | Parent | Parent Phone')
      md.push('---|---|---|---')
      for (let r = 1; r <= 30; r++) {
        const serial = BigInt(((c-1)*2 + sIdx)*30 + r)
        const phone = String(basePhone + serial)
        const usn = `${c}${sec}${pad2(r)}`
        const parentFirst = pick(FIRST_NAMES, c * 60 + r + sIdx * 5)
        const parentLast = pick(LAST_NAMES, r + c * 3 + sIdx)
        const parentName = `${parentFirst} ${parentLast}`
        const studentFirst = pick(FIRST_NAMES, r + c * 11 + sIdx * 13)
        const studentLast = pick(LAST_NAMES, c * 17 + r + sIdx)
        const studentName = `${studentFirst} ${studentLast}`
        md.push(`${usn} | ${studentName} | ${parentName} | ${phone}`)
      }
      md.push('')
    }
  }
  const outPath = path.resolve(process.cwd(), 'docs', 'dummy.md')
  await fs.writeFile(outPath, md.join('\n'), 'utf8')

  console.log('Dummy data seeded and docs/dummy.md written.')
  await db.end()
}

main().catch((err) => { console.error('Seed dummy error:', err); process.exitCode = 1 })
