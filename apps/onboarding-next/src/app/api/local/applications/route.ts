import { NextResponse } from 'next/server'
import { exec, query } from '../../_lib/db'
import { gradeToSAS } from '../_lib/grade'

export async function POST(req: Request) {
  const parentPhone = req.headers.get('x-parent-phone') || ''
  const { application } = await req.json().catch(() => ({}))
  if (!parentPhone || !application) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const applicantName = `${application?.student?.firstName || ''} ${application?.student?.lastName || ''}`.trim() || 'Applicant'
  const gradeApplied = String(application?.admission?.grade || '')
  const sectionPref = String(application?.admission?.section || '') || null
  await exec(
    'INSERT INTO applications (applicant_name, parent_phone, grade_applied, section_pref, status, data_json) VALUES (?, ?, ?, ?, "submitted", ?)',
    [applicantName, parentPhone, gradeApplied, sectionPref, JSON.stringify(application)]
  )
  const ins = await query<any>('SELECT LAST_INSERT_ID() AS id')
  const id = String((ins[0] as any).id)
  return NextResponse.json({ ok: true, id, status: 'submitted' })
}
