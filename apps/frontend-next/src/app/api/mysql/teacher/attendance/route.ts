import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code })
}

async function resolveIds(klass: string, section: string, subject?: string) {
  const cls = await query<{ id: number }>('SELECT id FROM classes WHERE name=?', [klass])
  if (!cls.length) return { classId: 0, sectionId: 0, subjectId: null as number | null }
  const sec = await query<{ id: number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
  if (!sec.length) return { classId: cls[0].id, sectionId: 0, subjectId: null as number | null }
  let subjectId: number | null = null
  if (subject && subject.trim()) {
    const sub = await query<{ id: number }>('SELECT id FROM subjects WHERE LOWER(name)=LOWER(?)', [subject])
    if (sub.length) subjectId = sub[0].id
  }
  return { classId: cls[0].id, sectionId: sec[0].id, subjectId }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ymd = searchParams.get('date') || ''
    const klass = searchParams.get('klass') || ''
    const section = searchParams.get('section') || ''
    const hour = Number(searchParams.get('hour') || '0')
    const subject = searchParams.get('subject') || undefined
    if (!ymd || !klass || !section || !hour) return bad('missing params')
    const { classId, sectionId, subjectId } = await resolveIds(klass, section, subject)
    if (!classId || !sectionId) return NextResponse.json({ map: {} })
    const rows = await query<{ id: number }>(
      'SELECT id FROM attendance WHERE ymd=? AND class_id=? AND section_id=? AND hour_no=? AND (subject_id <=> ?)',
      [ymd, classId, sectionId, hour, subjectId]
    )
    if (!rows.length) return NextResponse.json({ map: {} })
    const attId = rows[0].id
    const entries = await query<{ usn: string; present: number }>(
      `SELECT s.usn AS usn, ae.present AS present
         FROM attendance_entries ae
         JOIN students s ON s.id = ae.student_id
        WHERE ae.attendance_id=?`,
      [attId]
    )
    const map: Record<string, boolean> = {}
    for (const e of entries) map[e.usn] = !!e.present
    return NextResponse.json({ map })
  } catch {
    return NextResponse.json({ map: {} })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ymd = String(body.date || '')
    const klass = String(body.klass || '')
    const section = String(body.section || '')
    const hour = Number(body.hour || 0)
    const map = (body.map || {}) as Record<string, boolean>
    const subject = typeof body.subject === 'string' ? String(body.subject) : undefined
    if (!ymd || !klass || !section || !hour || typeof map !== 'object') return bad('invalid_payload')
    const { classId, sectionId, subjectId } = await resolveIds(klass, section, subject)
    if (!classId || !sectionId) return bad('class_or_section_not_found', 404)
    // Create or fetch attendance slot
    const existing = await query<{ id: number }>(
      'SELECT id FROM attendance WHERE ymd=? AND class_id=? AND section_id=? AND hour_no=? AND (subject_id <=> ?)',
      [ymd, classId, sectionId, hour, subjectId]
    )
    let attId = existing[0]?.id
    if (!attId) {
      const r = await query<any>('INSERT INTO attendance (ymd, class_id, section_id, hour_no, subject_id) VALUES (?,?,?,?,?)',
        [ymd, classId, sectionId, hour, subjectId ?? null])
      attId = r.insertId
    } else {
      // Clear previous entries for idempotent update
      await query('DELETE FROM attendance_entries WHERE attendance_id=?', [attId])
    }
    // Insert entries
    if (map && Object.keys(map).length) {
      // Resolve student ids for given USNs in one query
      const usns = Object.keys(map)
      const placeholders = usns.map(()=>'?').join(',')
      const studs = await query<{ id:number; usn:string }>(`SELECT id, usn FROM students WHERE usn IN (${placeholders})`, usns as any)
      const usnToId = new Map(studs.map(s => [s.usn, s.id]))
      for (const [usn, present] of Object.entries(map)) {
        const sid = usnToId.get(usn)
        if (!sid) continue
        await query('INSERT INTO attendance_entries (attendance_id, student_id, present) VALUES (?,?,?)', [attId, sid, present ? 1 : 0])
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}

