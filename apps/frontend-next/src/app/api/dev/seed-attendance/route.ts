import { NextResponse } from 'next/server'
import { query } from '../../_lib/db'

function fmtYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function POST() {
  try {
    // 1) Resolve all active students with their class/section ids
    const students = await query<{
      id: number
      usn: string
      class_id: number
      section_id: number
    }>(
      `SELECT s.id, s.usn, s.class_id, s.section_id
         FROM students s
        WHERE s.status = 'active'`,
      [],
    )

    if (!students.length) {
      return NextResponse.json({ ok: true, message: 'No students found; nothing to seed.' })
    }

    // Group students by class + section
    const groups = new Map<
      string,
      { classId: number; sectionId: number; studentIds: number[] }
    >()
    for (const s of students) {
      const key = `${s.class_id}|${s.section_id}`
      const entry =
        groups.get(key) ||
        { classId: s.class_id, sectionId: s.section_id, studentIds: [] }
      entry.studentIds.push(s.id)
      groups.set(key, entry)
    }

    // 2) Date range: last 3 months (weekdays only)
    const today = new Date()
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const start = new Date(end)
    start.setMonth(start.getMonth() - 3)

    const startYmd = fmtYmd(start)
    const endYmd = fmtYmd(end)

    // 3) Clear any existing attendance in that range to avoid duplicates
    await query(
      `DELETE ae FROM attendance_entries ae
        JOIN attendance a ON ae.attendance_id = a.id
       WHERE a.ymd BETWEEN ? AND ?`,
      [startYmd, endYmd],
    )
    await query('DELETE FROM attendance WHERE ymd BETWEEN ? AND ?', [startYmd, endYmd])

    // 4) Seed random attendance per class/section/hour/day
    const HOURS = [1, 2, 3, 4, 5]
    let totalSlots = 0
    let totalEntries = 0

    const cursor = new Date(start)
    while (cursor <= end) {
      const dow = cursor.getDay() // 0=Sun,6=Sat
      if (dow !== 0 && dow !== 6) {
        const ymd = fmtYmd(cursor)
        for (const { classId, sectionId, studentIds } of groups.values()) {
          for (const hour of HOURS) {
            // Create attendance slot (subject_id left NULL for dummy data)
            const r = await query<any>(
              'INSERT INTO attendance (ymd, class_id, section_id, hour_no, subject_id) VALUES (?,?,?,?,NULL)',
              [ymd, classId, sectionId, hour],
            )
            const attId = r.insertId as number
            totalSlots += 1

            if (!studentIds.length) continue

            // Build batch INSERT for entries
            const values: Array<number | boolean> = []
            const placeholders: string[] = []
            for (const sid of studentIds) {
              // Bias towards present (around 90% present)
              const present = Math.random() < 0.9
              placeholders.push('(?,?,?)')
              values.push(attId, sid, present ? 1 : 0)
              totalEntries += 1
            }
            await query(
              `INSERT INTO attendance_entries (attendance_id, student_id, present) VALUES ${placeholders.join(
                ',',
              )}`,
              values as any[],
            )
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded dummy attendance for last 3 months`,
      slots: totalSlots,
      entries: totalEntries,
      range: { start: startYmd, end: endYmd },
      classes: groups.size,
      students: students.length,
    })
  } catch (err) {
    console.error('seed-attendance error', err)
    return NextResponse.json({ ok: false, error: 'seed_failed' }, { status: 500 })
  }
}

