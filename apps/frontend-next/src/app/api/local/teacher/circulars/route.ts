import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const klass = searchParams.get('klass') || ''
  const section = searchParams.get('section') || ''
  const db = readDB()
  let items: any[] = Array.isArray(db.circulars) ? db.circulars : []
  if (klass) items = items.filter(c => c.klass === klass)
  if (section) items = items.filter(c => c.section === section)
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const c = await req.json().catch(() => ({}))
  if (!c || !c.title || !c.klass || !c.section) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  const arr: any[] = Array.isArray(db.circulars) ? db.circulars : []
  const withTs = c.ts ? c : { ...c, ts: Date.now() }
  arr.unshift(withTs)
  db.circulars = arr
  writeDB(db)
  return NextResponse.json({ ok: true })
}

