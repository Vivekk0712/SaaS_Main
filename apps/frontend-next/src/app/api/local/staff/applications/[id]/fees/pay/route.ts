import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../../_lib/filedb'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  const idx = db.fees.findIndex((f) => f.appId === params.id)
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const entry: any = db.fees[idx] as any
  entry.payment = entry.payment || {}
  entry.payment.confirmed = true
  entry.payment.date = new Date().toISOString()
  entry.updatedAt = new Date().toISOString()
  db.fees[idx] = entry
  writeDB(db)
  return NextResponse.json({ ok: true, payment: entry.payment })
}

