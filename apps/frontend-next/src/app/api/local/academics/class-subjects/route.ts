import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const klass = String(searchParams.get('klass') || '')
  const section = String(searchParams.get('section') || '')
  const key = `${klass}|${section}`
  const db = readDB()
  const map = db.academics?.classSubjects || {}
  const items = klass && section ? (map[key] || []) : []
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const { klass, section, items } = await req.json().catch(() => ({}))
  if (!klass || !section || !Array.isArray(items)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  db.academics = db.academics || {}
  const map = db.academics.classSubjects || {}
  map[`${klass}|${section}`] = items
  db.academics.classSubjects = map
  writeDB(db)
  return NextResponse.json({ ok: true })
}
