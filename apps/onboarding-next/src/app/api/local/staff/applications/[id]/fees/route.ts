import { NextResponse } from 'next/server'
import { exec, query } from '../../../../../_lib/db'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rows = await query<any>('SELECT data_json FROM applications WHERE id=?', [Number(params.id)])
  if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const data = rows[0].data_json || {}
  const fee = (data && data.fees) ? data.fees : null
  if (!fee) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ appId: String(params.id), ...fee })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { items, total, installments } = await req.json().catch(() => ({}))
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items_required' }, { status: 400 })
  const id = Number(params.id)
  const rows = await query<any>('SELECT data_json FROM applications WHERE id=?', [id])
  if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const data = rows[0].data_json || {}
  const computedTotal = typeof total === 'number' ? total : items.reduce((s:number, it:any)=> s + Number(it.amount||0), 0)
  const feesObj = { items, total: computedTotal, installments: Array.isArray(installments) ? installments : (installments && (installments as any).parts) ? (installments as any).parts : undefined, updatedAt: new Date().toISOString() }
  const next = { ...(data || {}), fees: feesObj }
  await exec('UPDATE applications SET data_json=?, status="fees_set" WHERE id=?', [JSON.stringify(next), id])
  return NextResponse.json({ ok: true })
}
