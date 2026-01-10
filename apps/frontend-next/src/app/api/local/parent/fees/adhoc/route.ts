import { NextResponse } from 'next/server'
import { readDB } from '../../../_lib/filedb'

function phoneKey(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = String(searchParams.get('phone') || '')
  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
  const db = readDB()
  const want = phoneKey(phone)
  const bills = (db.adhocBills || []).filter(b => phoneKey(String(b.parentPhone || '')) === want)
  // Sort newest first
  bills.sort((a:any,b:any) => String(b.createdAt||'').localeCompare(String(a.createdAt||'')))
  return NextResponse.json({ items: bills })
}
