import { NextResponse } from 'next/server'
import { exec, query } from '../../../../_lib/db'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rows = await query<any>('SELECT id, applicant_name, parent_phone, grade_applied, section_pref, status, created_at, data_json FROM applications WHERE id=?', [Number(params.id)])
  if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { application } = await req.json().catch(() => ({}))
  if (!application || typeof application !== 'object') return NextResponse.json({ error: 'application_required' }, { status: 400 })
  await exec('UPDATE applications SET data_json=? WHERE id=?', [JSON.stringify(application), Number(params.id)])
  return NextResponse.json({ ok: true })
}
