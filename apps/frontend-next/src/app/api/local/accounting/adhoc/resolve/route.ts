import { NextResponse } from 'next/server'
import { readDB } from '../../../_lib/filedb'
import { query } from '../../../_lib/db'

type Target =
  | { type: 'student'; studentName?: string; parentPhone?: string }
  | { type: 'class'; grade: string }
  | { type: 'section'; grade: string; section: string }
  | { type: 'classes'; grades: string[] }

function phoneKey(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

function normalizeName(name: string) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function seedPhoneFallback(grade: string, section: string, usn: string) {
  const gradeMatch = String(grade || '').match(/CLASS\s+(\d+)/i)
  const usnMatch = String(usn || '').match(/^(\d+)([A-Za-z])(\d{2})$/)
  let klass = gradeMatch ? Number(gradeMatch[1]) : undefined
  const sec = String(section || usnMatch?.[2] || '').toUpperCase()
  const roll = usnMatch ? Number(usnMatch[3]) : undefined
  if (!klass && usnMatch) klass = Number(usnMatch[1])
  if (!klass || !roll || (sec !== 'A' && sec !== 'B')) return ''
  const base = 9000000000
  const sIdx = sec === 'B' ? 1 : 0
  const serial = ((klass - 1) * 2 + sIdx) * 30 + roll
  return String(base + serial)
}

export async function POST(req: Request) {
  const { target } = await req.json().catch(() => ({})) as { target?: Target }
  if (!target || !target.type) return NextResponse.json({ items: [] })
  
  try {
    const db = readDB()
    let students = (db.profiles?.students || []).map((s: any) => ({
      appId: String(s.roll || ''),
      name: String(s.name || ''),
      grade: String(s.grade || ''),
      section: String(s.section || ''),
      parentPhone: String(s.fatherPhone || ''),
    }))
    if (students.length === 0) {
      const rows = await query<{
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
      students = rows.map((s) => {
        const grade = String(s.grade || '')
        const section = String(s.section || '')
        const usn = String(s.usn || '')
        const parentPhone = String(s.parentPhone || '') || seedPhoneFallback(grade, section, usn)
        return {
          appId: usn,
          name: String(s.name || ''),
          grade,
          section,
          parentPhone,
        }
      })
    }

    const matches = (s: any): boolean => {
      const grade = String(s.grade || '')
      const section = String(s.section || '')
      const name = normalizeName(s.name || '')
      const phone = phoneKey(String(s.parentPhone || ''))
      
      if (target.type === 'student') {
        const wantName = normalizeName(target.studentName || '')
        const wantPhone = phoneKey(target.parentPhone || '')
        const nameMatch = wantName ? name === wantName : false
        const phoneMatch = wantPhone ? phone === wantPhone : true
        if (wantName && wantPhone) return nameMatch && phoneMatch
        if (wantName) return nameMatch
        if (wantPhone) return phoneMatch
        return false
      }
      if (target.type === 'class') return grade === String((target as any).grade || '')
      if (target.type === 'section') return grade === String((target as any).grade || '') && section === String((target as any).section || '')
      if (target.type === 'classes') return Array.isArray((target as any).grades) && (target as any).grades.map(String).includes(grade)
      return false
    }

    const items = students
      .filter(matches)
      .map((s) => ({
        appId: s.appId,
        name: s.name,
        grade: s.grade,
        section: s.section,
        parentPhone: phoneKey(s.parentPhone),
      }))

    return NextResponse.json({ items, count: items.length })
  } catch (err) {
    console.error('Failed to resolve adhoc recipients:', err)
    return NextResponse.json({ items: [], error: 'local_db_error' }, { status: 500 })
  }
}
