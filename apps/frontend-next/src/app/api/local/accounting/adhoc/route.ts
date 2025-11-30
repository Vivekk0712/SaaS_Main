import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET() {
  const db = readDB()
  return NextResponse.json({ items: db.adhocFees || [] })
}

export async function POST(req: Request) {
  const { title, purpose, items, target } = await req.json().catch(() => ({}))
  if (!title || !Array.isArray(items)) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const total = items.reduce((s: number, it: any) => s + Number(it.amount || 0), 0)
  const db = readDB()
  const id = `adhoc_${Date.now().toString(36)}`
  const entry = { id, title, purpose, items, total, target, createdAt: new Date().toISOString() }
  db.adhocFees = db.adhocFees || []
  db.adhocFees.push(entry)
  writeDB(db)
  return NextResponse.json({ ok: true, id })
}
