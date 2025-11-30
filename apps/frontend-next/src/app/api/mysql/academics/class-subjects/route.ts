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
    const cls = await query<{ id: number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return NextResponse.json({ items: [] })
    const sec = await query<{ id: number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return NextResponse.json({ items: [] })
    const rows = await query<{ name: string }>(
      `SELECT s.name FROM class_subjects cs
       JOIN subjects s ON s.id = cs.subject_id
       WHERE cs.class_id=? AND cs.section_id=?
       ORDER BY s.name ASC`,
      [cls[0].id, sec[0].id]
    )
    const items = rows.map(r => r.name)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    // Upsert list of subjects for a class/section
    const body = await req.json()
    const klass = String(body.klass || '')
    const section = String(body.section || '')
    const items: string[] = Array.isArray(body.items) ? body.items : []
    if (!klass || !section) return bad('missing klass/section')
    const cls = await query<{ id: number }>('SELECT id FROM classes WHERE name=?', [klass])
    if (!cls.length) return bad('class_not_found', 404)
    const sec = await query<{ id: number }>('SELECT id FROM sections WHERE class_id=? AND name=?', [cls[0].id, section])
    if (!sec.length) return bad('section_not_found', 404)

    // Resolve subject ids
    const names = Array.from(new Set(items.map(s => String(s || '').trim()).filter(Boolean)))
    const existing = await query<{ id: number; name: string }>(
      `SELECT id,name FROM subjects WHERE name IN (${names.map(()=> '?').join(',') || "''"})`,
      names.length ? names : ['']
    )
    const nameToId = new Map(existing.map(e => [e.name.toLowerCase(), e.id]))

    // Insert missing subjects
    for (const n of names) {
      if (!nameToId.has(n.toLowerCase())) {
        const r = await query<{ insertId: number }>('INSERT INTO subjects (name) VALUES (?)', [n]) as any
        nameToId.set(n.toLowerCase(), (r as any).insertId || 0)
      }
    }

    // Replace class_subjects set
    await query('DELETE FROM class_subjects WHERE class_id=? AND section_id=?', [cls[0].id, sec[0].id])
    for (const n of names) {
      const sid = nameToId.get(n.toLowerCase())
      if (sid) {
        await query('INSERT INTO class_subjects (class_id, section_id, subject_id) VALUES (?,?,?)', [cls[0].id, sec[0].id, sid])
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return bad('server_error', 500)
  }
}


