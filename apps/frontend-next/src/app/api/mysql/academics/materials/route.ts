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
    const subject = searchParams.get('subject') || ''
    if (!klass || !section || !subject) return bad('missing_fields')
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return NextResponse.json({ items: [] })
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return NextResponse.json({ items: [] })
    const sub = await query<{ id:number }>('SELECT id FROM subjects WHERE LOWER(name)=LOWER(?)', [subject])
    if (!sub.length) return NextResponse.json({ items: [] })
    const rows = await query<any>(
      `SELECT type, name, url, mime, data_url AS dataUrl, uploaded_at
         FROM materials
        WHERE class_id=? AND section_id=? AND subject_id=?
        ORDER BY uploaded_at DESC`,
      [cls[0].id, sec[0].id, sub[0].id]
    )
    return NextResponse.json({ items: rows })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const klass = String(body.klass || '')
    const section = String(body.section || '')
    const subject = String(body.subject || '')
    const item = body.item || {}
    if (!klass || !section || !subject || !item || !item.type) return bad('invalid_payload')
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return bad('class_not_found', 404)
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return bad('section_not_found', 404)
    const sub = await query<{ id:number }>('SELECT id FROM subjects WHERE LOWER(name)=LOWER(?)', [subject])
    if (!sub.length) return bad('subject_not_found', 404)
    await query(
      `INSERT INTO materials (class_id, section_id, subject_id, type, name, url, mime, data_url)
       VALUES (?,?,?,?,?,?,?,?)`,
      [cls[0].id, sec[0].id, sub[0].id, item.type, item.name || null, item.url || null, item.mime || null, item.dataUrl || null]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const klass = searchParams.get('klass') || ''
    const section = searchParams.get('section') || ''
    const subject = searchParams.get('subject') || ''
    const uploadedAt = searchParams.get('uploadedAt') // optional, to remove specific entry
    if (!klass || !section || !subject) return bad('missing_fields')
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    const sub = await query<{ id:number }>('SELECT id FROM subjects WHERE LOWER(name)=LOWER(?)', [subject])
    if (!cls.length || !sec.length || !sub.length) return bad('not_found', 404)
    if (uploadedAt) {
      await query(
        `DELETE FROM materials WHERE class_id=? AND section_id=? AND subject_id=? AND uploaded_at=?`,
        [cls[0].id, sec[0].id, sub[0].id, uploadedAt]
      )
    } else {
      await query(
        `DELETE FROM materials WHERE class_id=? AND section_id=? AND subject_id=?`,
        [cls[0].id, sec[0].id, sub[0].id]
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}

