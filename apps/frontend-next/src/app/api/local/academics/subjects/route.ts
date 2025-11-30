import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET() {
  const db = readDB()
  return NextResponse.json({ items: db.academics?.subjects || [] })
}

export async function POST(req: Request) {
  const { items } = await req.json().catch(() => ({}))
  if (!Array.isArray(items)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  db.academics = db.academics || {}
  db.academics.subjects = items
  writeDB(db)
  return NextResponse.json({ ok: true })
}
