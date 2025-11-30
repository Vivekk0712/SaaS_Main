import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { items, total, installments } = await req.json().catch(() => ({}))
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items_required' }, { status: 400 })
  const db = readDB()
  const app = db.applications.find(a => a.id === params.id)
  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const sum = typeof total === 'number' ? total : items.reduce((s: number, it: any) => s + Number(it.amount || 0), 0)
  const idx = db.fees.findIndex(f => f.appId === params.id)
  const entry: any = { appId: params.id, items, total: sum, updatedAt: new Date().toISOString() }
  if (installments && typeof installments.count === 'number') {
    entry.installments = {
      count: Math.max(1, Math.floor(Number(installments.count) || 1)),
      parts: Array.isArray(installments.parts) ? installments.parts : undefined,
    }
  }
  if (idx >= 0) db.fees[idx] = entry; else db.fees.push(entry)
  app.status = 'fees_set'
  writeDB(db)
  return NextResponse.json({ ok: true })
}
