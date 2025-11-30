import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET() {
  try {
    const rows = await query<{
      usn: string
      name: string
      grade: string
      section: string
      parentPhone: string | null
      parentName: string | null
    }>(
      `SELECT s.usn AS usn, s.name AS name, c.name AS grade, sec.name AS section,
              p.phone AS parentPhone, p.name AS parentName
         FROM students s
         JOIN classes c ON c.id = s.class_id
         JOIN sections sec ON sec.id = s.section_id
         LEFT JOIN parents p ON p.id = s.guardian_id
        ORDER BY c.name, sec.name, s.usn`
    )
    return NextResponse.json({ items: rows })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

