import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'

export async function POST(req: Request) {
  const { billId } = await req.json().catch(() => ({}))
  if (!billId) return NextResponse.json({ error: 'missing_bill' }, { status: 400 })
  const db = readDB()
  const arr = Array.isArray(db.adhocBills) ? db.adhocBills : []
  const idx = arr.findIndex(b => b.id === String(billId))
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const bill: any = arr[idx]
  bill.status = 'paid'
  bill.paidAt = new Date().toISOString()
  arr[idx] = bill
  db.adhocBills = arr
  writeDB(db)
  return NextResponse.json({ ok: true })
}
