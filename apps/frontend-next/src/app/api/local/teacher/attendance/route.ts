import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

function keyOf(date: string, klass: string, section: string, hour: number) {
  return `${date}|${klass}|${section}|${hour}`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || ''
  const klass = searchParams.get('klass') || ''
  const section = searchParams.get('section') || ''
  const hourStr = searchParams.get('hour') || ''
  const hour = Number(hourStr || '0')
  const db = readDB()
  const store = db.attendance || {}
  if (date && klass && section && hour) {
    const map = store[keyOf(date, klass, section, hour)] || {}
    return NextResponse.json({ map })
  }
  if (klass && section && !date && !hourStr) {
    // Return all records for the class/section keyed by attendanceKey
    const out: Record<string, Record<string, boolean>> = {}
    const suffix = `|${klass}|${section}|`
    for (const k of Object.keys(store)) { if (k.includes(suffix)) out[k] = store[k] }
    return NextResponse.json({ items: out })
  }
  return NextResponse.json({ map: {} })
}

export async function POST(req: Request) {
  const { date, klass, section, hour, map } = await req.json().catch(() => ({}))
  if (!date || !klass || !section || !hour || typeof map !== 'object') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const db = readDB()
  const k = keyOf(String(date), String(klass), String(section), Number(hour))
  db.attendance = db.attendance || {}
  db.attendance[k] = map || {}
  writeDB(db)
  return NextResponse.json({ ok: true })
}
