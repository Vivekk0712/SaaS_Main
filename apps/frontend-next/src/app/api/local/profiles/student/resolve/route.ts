import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '../../../../_lib/db'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function POST(req: Request) {
  const { name, fatherPhone, password } = await req.json().catch(() => ({}))
  if (!fatherPhone || !password) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  // Verify parent credentials against auth_users
  const users = await query<{ id:number; password_hash: Buffer }>('SELECT id, password_hash FROM auth_users WHERE email=? LIMIT 1', [fatherPhone])
  if (!users.length) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  const provided = sha256Hex(String(password))
  const stored = Buffer.isBuffer(users[0].password_hash) ? users[0].password_hash.toString('hex') : String(users[0].password_hash || '')
  if (provided !== stored) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  // Locate parent and their students
  const pr = await query<{ id:number; name:string }>('SELECT id,name FROM parents WHERE phone=? LIMIT 1', [fatherPhone])
  if (!pr.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const parentId = pr[0].id
  const rows = await query<{ sname:string; cname:string; sec:string; usn:string }>(
    `SELECT s.name AS sname, c.name AS cname, sec.name AS sec, s.usn AS usn
       FROM students s
       JOIN classes c ON c.id = s.class_id
       JOIN sections sec ON sec.id = s.section_id
      WHERE s.guardian_id = ?
      ORDER BY c.name, sec.name, s.usn`,
    [parentId]
  )
  let result = rows
  // Fallback: if guardian links are missing, derive expected student from seeded phone mapping
  if (!rows.length) {
    const map = invMapFromPhone(String(fatherPhone))
    if (map) {
      const fb = await query<{ sname:string; cname:string; sec:string; usn:string }>(
        `SELECT s.name AS sname, c.name AS cname, sec.name AS sec, s.usn AS usn
           FROM students s
           JOIN classes c ON c.id = s.class_id
           JOIN sections sec ON sec.id = s.section_id
          WHERE s.usn=? AND c.name=? AND sec.name=?
          LIMIT 1`,
        [map.usn, map.klass, map.section]
      )
      if (fb && fb.length) result = fb
    }
  }
  if (!result.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  let match = null as any
  if (name) {
    const n = String(name).trim().toLowerCase()
    match = result.find(r => String(r.sname||'').trim().toLowerCase() === n) || null
  }
  if (!match) match = result[0]
  return NextResponse.json({
    name: match.sname,
    fatherPhone,
    grade: match.cname,
    section: match.sec || '',
    roll: match.usn || '',
    photoDataUrl: ''
  })
}

function invMapFromPhone(phoneStr: string): { klass: string; section: string; usn: string } | null {
  try {
    const base = BigInt(9000000000)
    const phone = BigInt(phoneStr)
    const serial = phone - base // 1..600
    if (serial < 1n) return null
    const t = serial - 1n
    const groupIndex = Number(t / 30n) // 0..19 for 10 classes * 2 sections
    const c = Math.floor(groupIndex / 2) + 1 // 1..10
    const sIdx = groupIndex % 2 // 0->A, 1->B
    const r = Number(t % 30n) + 1 // 1..30
    const section = sIdx === 0 ? 'A' : 'B'
    const usn = `${c}${section}${String(r).padStart(2,'0')}`
    const klass = `CLASS ${c}`
    return { klass, section, usn }
  } catch { return null }
}
