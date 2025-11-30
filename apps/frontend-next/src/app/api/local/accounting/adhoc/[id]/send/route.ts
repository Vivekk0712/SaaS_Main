import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'
import { query } from '../../../../../_lib/db'

type Target =
  | { type: 'student'; studentName?: string; parentPhone?: string }
  | { type: 'class'; grade: string }
  | { type: 'section'; grade: string; section: string }
  | { type: 'classes'; grades: string[] }

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  const adhoc = (db.adhocFees || []).find(a => a.id === params.id)
  if (!adhoc) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const target = adhoc.target as Target | undefined
  if (!target || !target.type) return NextResponse.json({ error: 'no_target' }, { status: 400 })

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

    const recipients = students.filter(matches).map((s) => ({ 
      appId: s.usn, 
      parentPhone: s.parentPhone || '', 
      name: s.name 
    }))

    db.adhocBills = Array.isArray(db.adhocBills) ? db.adhocBills : []
    const ts = new Date().toISOString()
    for (const r of recipients) {
      const bill = { 
        id: `adhoc_bill_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`, 
        adhocId: adhoc.id, 
        appId: r.appId, 
        parentPhone: r.parentPhone, 
        name: r.name, 
        title: adhoc.title, 
        items: adhoc.items, 
        total: adhoc.total, 
        createdAt: ts, 
        status: 'unpaid' as const 
      }
      db.adhocBills.push(bill)
    }
    writeDB(db)
    return NextResponse.json({ ok: true, delivered: recipients.length })
  } catch (err) {
    console.error('Failed to send adhoc fee:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
