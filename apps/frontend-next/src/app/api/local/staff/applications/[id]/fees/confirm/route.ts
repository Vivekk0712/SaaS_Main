import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../../_lib/filedb'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { role } = await req.json().catch(() => ({}))
  const db = readDB()
  const idx = db.fees.findIndex((f) => f.appId === params.id)
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const entry: any = db.fees[idx] as any
  entry.confirmations = entry.confirmations || {}
  if (role === 'admissions' || role === 'principal' || role === 'accountant') {
    entry.confirmations[role] = true
  }
  entry.updatedAt = new Date().toISOString()
  db.fees[idx] = entry
  writeDB(db)
  return NextResponse.json({ ok: true, confirmations: entry.confirmations })
}

