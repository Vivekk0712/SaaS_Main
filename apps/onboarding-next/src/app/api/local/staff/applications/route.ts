import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = String(searchParams.get('status') || 'submitted')
  const rows = await query<any>(
    'SELECT id, applicant_name, parent_phone, grade_applied, section_pref, status, created_at, data_json FROM applications WHERE status=? ORDER BY created_at DESC',
    [status]
  )
  return NextResponse.json({ items: rows })
}
