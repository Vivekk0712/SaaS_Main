import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'

export async function POST(req: Request) {
  const { fatherPhone, newPassword, name } = await req.json().catch(() => ({}))
  if (!fatherPhone || !newPassword) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const db = readDB()
  const profiles = db.profiles || { parents: [], students: [] }
  let updated = 0
  const list = (profiles.students || []).filter(s => String(s.fatherPhone) === String(fatherPhone))
  if (name) {
    const n = String(name).trim().toLowerCase()
    const s = list.find(sp => sp.name && sp.name.trim().toLowerCase() === n)
    if (s) { (s as any).password = newPassword; updated++ }
  } else {
    // If name not provided, set for all children for this phone
    for (const s of list) { (s as any).password = newPassword; updated++ }
  }
  db.profiles = profiles
  writeDB(db)
  if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true, updated })
}

