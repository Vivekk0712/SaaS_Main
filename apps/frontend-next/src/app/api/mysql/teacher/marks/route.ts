import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET() {
  try {
    const sheets = await query<{
      id: number
      test: string
      subject: string
      klass: string
      section: string
      date_ymd: string | null
      max_marks: number
    }>(
      `SELECT ms.id, t.name AS test, s.name AS subject, c.name AS klass, sec.name AS section,
              DATE_FORMAT(ms.date_ymd, '%Y-%m-%d') AS date_ymd, ms.max_marks
         FROM mark_sheets ms
         JOIN tests t ON t.id = ms.test_id
         JOIN subjects s ON s.id = ms.subject_id
         JOIN classes c ON c.id = ms.class_id
         JOIN sections sec ON sec.id = ms.section_id
        ORDER BY ms.id DESC`
    )
    const ids = sheets.map(s => s.id)
    let entries: Array<{ sheet_id:number; student_usn:string; marks:number }> = []
    if (ids.length) {
      const placeholders = ids.map(()=>'?').join(',')
      entries = await query(
        `SELECT me.sheet_id, stu.usn AS student_usn, me.marks
           FROM mark_entries me
           JOIN students stu ON stu.id = me.student_id
          WHERE me.sheet_id IN (${placeholders})`,
        ids as any
      )
    }
    // group entries
    const bySheet = new Map<number, Array<{ student_usn:string; marks:number }>>()
    for (const e of entries) {
      const arr = bySheet.get(e.sheet_id) || []
      arr.push({ student_usn: e.student_usn, marks: e.marks })
      bySheet.set(e.sheet_id, arr)
    }
    const items = sheets.map(s => ({
      test: s.test,
      subject: s.subject,
      klass: s.klass,
      section: s.section,
      date: s.date_ymd,
      max: s.max_marks,
      marks: Object.fromEntries((bySheet.get(s.id) || []).map(e => [e.student_usn, e.marks]))
    }))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

