import { NextResponse } from 'next/server'
import { query } from '../../../../_lib/db'

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const test = String(body.test || '')
    const subject = String(body.subject || '')
    const klass = String(body.klass || '')
    const section = String(body.section || '')
    const date = body.date ? String(body.date) : null
    const max = Number(body.max || 0)
    const marks = body.marks || {} // { usn: number }
    if (!test || !subject || !klass || !section || !max) return bad('invalid_payload')
    // resolve IDs
    const t = await query<{ id:number }>('SELECT id FROM tests WHERE LOWER(name)=LOWER(?)', [test])
    const sub = await query<{ id:number }>('SELECT id FROM subjects WHERE LOWER(name)=LOWER(?)', [subject])
    const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=?', [klass])
    const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0]?.id, section])
    if (!t.length || !sub.length || !cls.length || !sec.length) return bad('entity_not_found', 404)
    // upsert sheet
    const exist = await query<{ id:number }>(
      `SELECT id FROM mark_sheets WHERE test_id=? AND subject_id=? AND class_id=? AND section_id=?`,
      [t[0].id, sub[0].id, cls[0].id, sec[0].id]
    )
    let sheetId = exist[0]?.id
    if (!sheetId) {
      const r = await query<any>(
        `INSERT INTO mark_sheets (test_id, subject_id, class_id, section_id, date_ymd, max_marks)
         VALUES (?,?,?,?,?,?)`,
        [t[0].id, sub[0].id, cls[0].id, sec[0].id, date, max]
      )
      sheetId = r.insertId
    } else {
      await query(`UPDATE mark_sheets SET date_ymd=?, max_marks=? WHERE id=?`, [date, max, sheetId])
      await query(`DELETE FROM mark_entries WHERE sheet_id=?`, [sheetId])
    }
    // insert entries
    const usns = Object.keys(marks || {})
    if (usns.length) {
      const placeholders = usns.map(()=>'?').join(',')
      const studs = await query<{ id:number; usn:string }>(`SELECT id, usn FROM students WHERE usn IN (${placeholders})`, usns as any)
      const usnToId = new Map(studs.map(s => [s.usn, s.id]))
      for (const [usn, score] of Object.entries(marks as Record<string, number>)) {
        const sid = usnToId.get(usn)
        if (!sid) continue
        await query(`INSERT INTO mark_entries (sheet_id, student_id, marks) VALUES (?,?,?)`, [sheetId, sid, Number(score || 0)])
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}

