import { NextResponse } from 'next/server'
import { readDB } from '../../_lib/filedb'

type Part = { label?: string; amount: number; dueDate?: string }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = String(searchParams.get('phone') || '')
  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
  const db = readDB()
  const apps = db.applications.filter(a => String(a.parentPhone) === String(phone))
  if (!apps.length) return NextResponse.json({ items: [] })
  // pick latest app by createdAt
  const app = apps.sort((a,b)=> String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]
  const fee = db.fees.find(f => String(f.appId) === String(app.id)) as any || null
  if (!fee) return NextResponse.json({ items: [] })
  // normalize installments to array of parts with dueDate
  let parts: Part[] = []
  const ins:any = fee.installments
  if (Array.isArray(ins)) {
    parts = ins.map((p:any)=> ({ label: p?.label, amount: Number(p?.amount||0), dueDate: p?.dueDate ? String(p.dueDate).slice(0,10) : undefined }))
  } else if (ins && Array.isArray(ins.parts)) {
    parts = ins.parts.map((p:any)=> (typeof p === 'object' ? ({ label: p?.label, amount: Number(p?.amount||0), dueDate: p?.dueDate ? String(p.dueDate).slice(0,10) : undefined }) : ({ amount: Number(p||0) })))
  }
  const payment = fee.payment || {}
  const paidParts: boolean[] = Array.isArray(payment.parts) ? payment.parts : Array(parts.length).fill(false)
  const nextIdx = paidParts.findIndex(v => !v)
  const nextDue = nextIdx >= 0 ? parts[nextIdx] : null
  return NextResponse.json({
    appId: app.id,
    items: fee.items || [],
    total: Number(fee.total||0),
    parts,
    paidParts,
    nextIndex: nextIdx,
    nextDue,
    updatedAt: fee.updatedAt || '',
  })
}

