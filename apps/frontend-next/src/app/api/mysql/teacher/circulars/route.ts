import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const klass = searchParams.get('klass') || ''
    const section = searchParams.get('section') || ''
    if (!klass || !section) return bad('missing klass/section')
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return NextResponse.json({ items: [] })
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return NextResponse.json({ items: [] })
    const rows = await query<any>(
      `SELECT title, body, DATE_FORMAT(ymd,'%Y-%m-%d') AS date, color, ts
         FROM circulars
        WHERE class_id=? AND section_id=?
        ORDER BY ts DESC`,
      [cls[0].id, sec[0].id]
    )
    // map to existing shape
    const items = rows.map((c:any) => ({
      title: c.title, body: c.body, date: c.date, klass, section,
      color: c.color, ts: new Date(c.ts).getTime()
    }))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const title = String(body.title || '')
    const klass = String(body.klass || '')
    const section = String(body.section || '')
    const date = String(body.date || '')
    const color = String(body.color || 'blue')
    const cbody = String(body.body || '')
    if (!title || !klass || !section || !date) return bad('missing_fields')
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return bad('class_not_found', 404)
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return bad('section_not_found', 404)
    await query(
      `INSERT INTO circulars (title, body, ymd, class_id, section_id, color) VALUES (?,?,?,?,?,?)`,
      [title, cbody, date, cls[0].id, sec[0].id, color]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}

