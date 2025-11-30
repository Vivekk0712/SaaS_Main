import { NextResponse } from 'next/server'
import { query } from '../_lib/db'

type Row = {
  name: string
  grade: string
  section: string
  roll: string
  parentPhone: string | null
  parentName: string | null
}

export async function GET() {
  const rows = await query<Row>(
    `SELECT s.name AS name,
            c.name AS grade,
            sec.name AS section,
            s.usn  AS roll,
            p.phone AS parentPhone,
            p.name  AS parentName
       FROM students s
       JOIN classes c ON c.id = s.class_id
       JOIN sections sec ON sec.id = s.section_id
  LEFT JOIN parents p ON p.id = s.guardian_id
      ORDER BY c.name, sec.name, s.usn`
  )
  const items = rows.map(r => ({
    name: r.name,
    grade: r.grade,
    section: r.section,
    roll: r.roll,
    parentPhone: r.parentPhone || '',
    parentName: r.parentName || '',
    photo: ''
  }))
  return NextResponse.json({ items })
}
