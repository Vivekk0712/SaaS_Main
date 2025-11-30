import { NextResponse } from 'next/server'
import { readDB } from '../../../_lib/filedb'

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}
function isSameWeek(d: Date, ref: Date) {
  const oneDay = 24*60*60*1000
  const start = new Date(ref)
  start.setHours(0,0,0,0)
  const day = start.getDay() // 0 Sun
  const mondayOffset = (day === 0 ? -6 : 1 - day)
  const weekStart = new Date(start.getTime() + mondayOffset*oneDay)
  const weekEnd = new Date(weekStart.getTime() + 7*oneDay)
  return d >= weekStart && d < weekEnd
}
function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const paidFilter = (searchParams.get('paid') || '').toLowerCase() // '', 'true','false','today','week','month'
  const db = readDB()
  const parents = db.profiles?.parents || []
  const now = new Date()

  const byAppId: Record<string, any> = {}
  for (const app of db.applications) byAppId[app.id] = app

  const feeByParent: Record<string, any[]> = {}
  for (const f of db.fees as any[]) {
    const app = byAppId[f.appId]
    if (!app) continue
    const parentPhone = app.parentPhone
    if (!feeByParent[parentPhone]) feeByParent[parentPhone] = []
    feeByParent[parentPhone].push({ ...f, app })
  }

  const items = (db.profiles?.students || []).map((s) => {
    const parentPhone = s.fatherPhone || ''
    const list = feeByParent[parentPhone] || []
    // pick latest fee by updatedAt
    const latest = list.sort((a,b)=> String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0]
    const payment = latest?.payment || null
    const paid = !!(payment && payment.confirmed)
    const paidAt = payment?.date ? new Date(payment.date) : null
    const parentName = parents.find(p => p.phone === parentPhone)?.parentName || ''
    // Compute next due from installments (first installment by convention)
    let nextDueAmount = 0
    let nextDueDate = ''
    const ins: any = latest?.installments
    if (Array.isArray(ins) && ins.length) {
      nextDueAmount = Number(ins[0]?.amount || 0)
      nextDueDate = ins[0]?.dueDate ? String(ins[0].dueDate).slice(0,10) : ''
    } else if (ins && Array.isArray(ins.parts) && ins.parts.length) {
      const p0 = ins.parts[0]
      nextDueAmount = Number((p0 && typeof p0 === 'object' ? (p0.amount||0) : p0) || 0)
      nextDueDate = (p0 && typeof p0 === 'object' && p0.dueDate) ? String(p0.dueDate).slice(0,10) : ''
    }

    const entry = {
      name: s.name,
      grade: s.grade || '',
      section: s.section || '',
      roll: s.roll || '',
      fatherPhone: parentPhone,
      parentName,
      photo: s.photoDataUrl || '',
      feeTotal: Number(latest?.total || 0),
      paid,
      paidAt: paidAt ? paidAt.toISOString() : '',
      appId: latest?.appId || (latest?.app?.id) || '',
      nextDueAmount,
      nextDueDate,
    }
    return entry
  })

  const filtered = items.filter((it) => {
    if (!paidFilter) return true
    const paidAt = it.paidAt ? new Date(it.paidAt) : null
    switch (paidFilter) {
      case 'true': return it.paid
      case 'false': return !it.paid
      case 'today': return it.paid && paidAt && isSameDay(paidAt, now)
      case 'week': return it.paid && paidAt && isSameWeek(paidAt, now)
      case 'month': return it.paid && paidAt && isSameMonth(paidAt, now)
      default: return true
    }
  })

  return NextResponse.json({ items: filtered })
}
