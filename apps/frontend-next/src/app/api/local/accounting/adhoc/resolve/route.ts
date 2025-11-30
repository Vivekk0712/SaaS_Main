import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

type Target =
  | { type: 'student'; studentName?: string; parentPhone?: string }
  | { type: 'class'; grade: string }
  | { type: 'section'; grade: string; section: string }
  | { type: 'classes'; grades: string[] }

export async function POST(req: Request) {
  const { target } = await req.json().catch(() => ({})) as { target?: Target }
  if (!target || !target.type) return NextResponse.json({ items: [] })
  
  try {
    // Fetch students from MySQL
    const students = await query<{
      usn: string
      name: string
      grade: string
      section: string
      parentPhone: string | null
    }>(
      `SELECT s.usn, s.name, c.name AS grade, sec.name AS section, p.phone AS parentPhone
       FROM students s
       JOIN classes c ON c.id = s.class_id
       JOIN sections sec ON sec.id = s.section_id
       LEFT JOIN parents p ON p.id = s.guardian_id
       WHERE s.status = 'active'
       ORDER BY c.name, sec.name, s.usn`
    )

    const matches = (s: any): boolean => {
      const grade = String(s.grade || '')
      const section = String(s.section || '')
      const name = String(s.name || '').toLowerCase()
      const phone = String(s.parentPhone || '')
      
      if (target.type === 'student') {
        const wantName = (target.studentName || '').toLowerCase()
        const wantPhone = target.parentPhone || ''
        const nameMatch = wantName ? name.includes(wantName) : true
        const phoneMatch = wantPhone ? phone.includes(wantPhone) : true
        return nameMatch && phoneMatch
      }
      if (target.type === 'class') return grade === String((target as any).grade || '')
      if (target.type === 'section') return grade === String((target as any).grade || '') && section === String((target as any).section || '')
      if (target.type === 'classes') return Array.isArray((target as any).grades) && (target as any).grades.map(String).includes(grade)
      return false
    }

    const items = students.filter(matches).map((s) => ({
      appId: s.usn, // Use USN as identifier
      name: s.name,
      grade: s.grade,
      section: s.section,
      parentPhone: s.parentPhone || '',
    }))

    return NextResponse.json({ items, count: items.length })
  } catch (err) {
    console.error('Failed to resolve adhoc recipients:', err)
    return NextResponse.json({ items: [], error: 'database_error' }, { status: 500 })
  }
}

