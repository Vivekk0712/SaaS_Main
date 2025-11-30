import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const klass = searchParams.get('klass') || ''
    if (!klass) return bad('missing klass')
    const cls = await query<{ id: number }>('SELECT id FROM classes WHERE name=? LIMIT 1', [klass])
    if (!cls.length) return NextResponse.json({ items: [] })
    const rows = await query<{ name: string }>('SELECT name FROM sections WHERE class_id=? ORDER BY name ASC', [cls[0].id])
    return NextResponse.json({ items: rows.map(r => r.name) })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

