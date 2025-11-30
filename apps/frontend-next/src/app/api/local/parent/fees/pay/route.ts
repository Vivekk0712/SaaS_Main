import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'

export async function POST(req: Request) {
  const { appId, index } = await req.json().catch(() => ({}))
  if (!appId || typeof index !== 'number') return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const db = readDB()
  const idx = db.fees.findIndex(f => String((f as any).appId) === String(appId))
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const entry:any = db.fees[idx] as any
  const ins:any = entry.installments
  const count = Array.isArray(ins) ? ins.length : (ins && Array.isArray(ins.parts) ? ins.parts.length : 0)
  if (index < 0 || index >= count) return NextResponse.json({ error: 'bad_index' }, { status: 400 })
  entry.payment = entry.payment || {}
  const arr:boolean[] = Array.isArray(entry.payment.parts) ? entry.payment.parts : Array(count).fill(false)
  arr[index] = true
  entry.payment.parts = arr
  entry.payment.date = new Date().toISOString()
  // If all paid, mark confirmed
  if (arr.every(Boolean)) entry.payment.confirmed = true
  entry.updatedAt = new Date().toISOString()
  db.fees[idx] = entry
  writeDB(db)
  return NextResponse.json({ ok: true, payment: entry.payment })
}

