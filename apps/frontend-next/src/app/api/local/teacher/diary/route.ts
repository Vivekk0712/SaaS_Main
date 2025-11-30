import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || ''
  const db = readDB()
  const arr = (db.diary || {})[date] || []
  return NextResponse.json({ items: arr })
}

export async function POST(req: Request) {
  const { date, entry } = await req.json().catch(() => ({}))
  if (!date || !entry) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  const store = db.diary || {}
  const list: any[] = Array.isArray(store[date]) ? store[date] : []
  const next = entry.ts ? entry : { ...entry, ts: Date.now() }
  const filtered = list.filter((e: any) => !(
    e.subject?.toLowerCase?.() === next.subject?.toLowerCase?.() &&
    e.klass === next.klass &&
    e.section === next.section
  ))
  store[date] = [next, ...filtered]
  db.diary = store
  writeDB(db)
  return NextResponse.json({ ok: true })
}

