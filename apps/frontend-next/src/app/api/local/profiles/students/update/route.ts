import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'
import { gradeToSAS } from '../../../_lib/grade'

export async function POST(req: Request) {
  const { updates } = await req.json().catch(() => ({})) as { updates?: Array<{ name:string; fatherPhone:string; roll?:string; section?:string; grade?:string }> }
  if (!Array.isArray(updates)) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  const db = readDB()
  const list = db.profiles?.students || []
  updates.forEach(u => {
    const idx = list.findIndex(s => s.name.trim().toLowerCase() === String(u.name||'').trim().toLowerCase() && String(s.fatherPhone) === String(u.fatherPhone))
    if (idx >= 0) {
      const cur = list[idx]
      if (typeof u.roll !== 'undefined') cur.roll = String(u.roll || '')
      if (typeof u.section !== 'undefined') cur.section = String(u.section || '')
      if (typeof u.grade !== 'undefined') cur.grade = gradeToSAS(String(u.grade || cur.grade || ''))
      list[idx] = cur
    }
  })
  db.profiles = db.profiles || { parents: [], students: [] }
  db.profiles.students = list
  writeDB(db)
  return NextResponse.json({ ok: true })
}
