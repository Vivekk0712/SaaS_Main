import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ymd = searchParams.get('date') || ''
    if (!ymd) return bad('missing_date')
    const rows = await query<any>(
      `SELECT d.id,
              DATE_FORMAT(d.ymd,'%Y-%m-%d') AS date,
              c.name AS klass, s.name AS section, sub.name AS subject,
              t.name AS teacher, d.note, d.attachments
         FROM diaries d
         JOIN classes c ON c.id = d.class_id
         JOIN sections s ON s.id = d.section_id
         JOIN subjects sub ON sub.id = d.subject_id
         LEFT JOIN teachers t ON t.id = d.teacher_id
        WHERE d.ymd=? 
        ORDER BY d.id DESC`,
      [ymd]
    )
    const items = rows.map((r: any) => ({
      subject: r.subject,
      teacher: r.teacher || 'Teacher',
      note: r.note,
      attachments: r.attachments ? JSON.parse(r.attachments) : [],
      klass: r.klass,
      section: r.section
    }))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ymd = String(body.date || '')
    const klass = String(body.entry?.klass || '')
    const section = String(body.entry?.section || '')
    const subject = String(body.entry?.subject || '')
    const teacher = String(body.entry?.teacher || '')
    const note = String(body.entry?.note || '')
    const attachments = Array.isArray(body.entry?.attachments) ? body.entry.attachments : []
    if (!ymd || !klass || !section || !subject) return bad('missing_fields')
    // resolve ids
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return bad('class_not_found', 404)
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return bad('section_not_found', 404)
    const sub = await query<{ id:number }>('SELECT id FROM subjects WHERE LOWER(name)=LOWER(?)', [subject])
    if (!sub.length) return bad('subject_not_found', 404)
    let teacherId: number | null = null
    if (teacher) {
      const t = await query<{ id:number }>('SELECT id FROM teachers WHERE name=?', [teacher])
      teacherId = t[0]?.id ?? null
    }
    // upsert: replace existing for same date+class+section+subject
    await query(
      `DELETE FROM diaries WHERE ymd=? AND class_id=? AND section_id=? AND subject_id=?`,
      [ymd, cls[0].id, sec[0].id, sub[0].id]
    )
    await query(
      `INSERT INTO diaries (ymd, class_id, section_id, subject_id, teacher_id, note, attachments) VALUES (?,?,?,?,?,?,?)`,
      [ymd, cls[0].id, sec[0].id, sub[0].id, teacherId, note, JSON.stringify(attachments)]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}

