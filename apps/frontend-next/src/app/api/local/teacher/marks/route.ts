import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

type MarkSheet = {
  test: string
  subject: string
  klass: string
  section: string
  date?: string
  max: number
  marks: Record<string, number>
  createdBy?: string
  ts?: number
}

export async function GET() {
  const db = readDB()
  const items = Array.isArray(db.marks) ? db.marks : []
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Partial<MarkSheet>
  if (!body || !body.test || !body.subject || !body.klass || !body.section || typeof body.max !== 'number' || typeof body.marks !== 'object') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const db = readDB()
  const next: MarkSheet = { test: String(body.test), subject: String(body.subject), klass: String(body.klass), section: String(body.section), date: body.date, max: Number(body.max), marks: body.marks || {}, createdBy: body.createdBy, ts: Date.now() }
  const key = (x: MarkSheet) => `${x.test.toLowerCase()}|${x.subject.toLowerCase()}|${x.klass}|${x.section}`
  const k = key(next)
  const arr: MarkSheet[] = Array.isArray(db.marks) ? db.marks : []
  const filtered = arr.filter(m => key(m) !== k)
  filtered.unshift(next)
  db.marks = filtered
  writeDB(db)
  return NextResponse.json({ ok: true })
}

