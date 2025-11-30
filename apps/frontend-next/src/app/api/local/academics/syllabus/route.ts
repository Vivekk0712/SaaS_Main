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
  const entry = (db.academics?.syllabus || {})[k] || { chapters: [] }
  return NextResponse.json(entry)
}

export async function POST(req: Request) {
  const { klass, section, subject, entry } = await req.json().catch(() => ({}))
  if (!klass || !section || !subject || !entry) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const db = readDB()
  db.academics = db.academics || {}
  const map = db.academics.syllabus || {}
  map[keyOf(klass, section, subject)] = entry
  db.academics.syllabus = map
  writeDB(db)
  return NextResponse.json({ ok: true })
}
