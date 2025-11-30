import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET() {
  const rows = await query<any>('SELECT id, applicant_name, parent_phone, grade_applied, section_pref, status, created_at, data_json FROM applications ORDER BY created_at DESC')
  const items = [] as any[]
  for (const r of rows) {
    const fee = r.data_json?.fees
    if (!fee) continue
    items.push({ appId: String(r.id), ...fee, app: r })
  }
  items.sort((a,b)=> String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))
  return NextResponse.json({ items })
}
