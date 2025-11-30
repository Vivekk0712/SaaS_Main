import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

function keyOf(klass:string, section:string, subject:string) { return `${klass}|${section}|${subject.toLowerCase()}` }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const klass = String(searchParams.get('klass') || '')
  const section = String(searchParams.get('section') || '')
  const subject = String(searchParams.get('subject') || '')
  const db = readDB()
  const k = keyOf(klass, section, subject)
  const items = (db.academics?.materials || {})[k] || []
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const { klass, section, subject, items } = await req.json().catch(() => ({}))
  if (!klass || !section || !subject || !Array.isArray(items)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  db.academics = db.academics || {}
  const map = db.academics.materials || {}
  map[keyOf(klass, section, subject)] = items
  db.academics.materials = map
  writeDB(db)
  return NextResponse.json({ ok: true })
}
