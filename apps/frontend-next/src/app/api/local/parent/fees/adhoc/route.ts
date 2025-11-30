import { NextResponse } from 'next/server'
import { readDB } from '../../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = String(searchParams.get('phone') || '')
  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
  const db = readDB()
  const bills = (db.adhocBills || []).filter(b => String(b.parentPhone) === phone)
  // Sort newest first
  bills.sort((a:any,b:any) => String(b.createdAt||'').localeCompare(String(a.createdAt||'')))
  return NextResponse.json({ items: bills })
}
