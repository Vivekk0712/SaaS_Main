import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || ''
  const ym = searchParams.get('ym') || '' // YYYY-MM
  const db = readDB()
  const store = db.calendar || {}
  if (date) {
    const v = store[date]
    const items = v ? (Array.isArray(v) ? v : [v]) : []
    return NextResponse.json({ items })
  }
  if (ym) {
    const out: any[] = []
    for (const k of Object.keys(store)) {
      if (k.slice(0,7) === ym) {
        const v = store[k]
        out.push(...(Array.isArray(v) ? v : [v]))
      }
    }
    return NextResponse.json({ items: out })
  }
  return NextResponse.json({ items: [] })
}

export async function POST(req: Request) {
  const ev = await req.json().catch(() => ({}))
  if (!ev || !ev.date || !ev.title) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  const store = db.calendar || {}
  const arr: any[] = Array.isArray(store[ev.date]) ? store[ev.date] : (store[ev.date] ? [store[ev.date]] : [])
  store[ev.date] = [ev, ...arr]
  db.calendar = store
  writeDB(db)
  return NextResponse.json({ ok: true })
}

