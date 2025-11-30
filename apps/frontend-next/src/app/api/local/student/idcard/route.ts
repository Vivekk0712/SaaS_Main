import { NextResponse } from 'next/server'
import { readDB } from '../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = String(searchParams.get('phone') || '').trim()
  const roll = String(searchParams.get('roll') || '').trim()
  if (!phone && !roll) {
    return NextResponse.json({ ok: false, details: null })
  }
  const db = readDB()
  let apps = db.applications || []

  if (phone) {
    apps = apps.filter(a => String((a as any).parentPhone || '') === phone)
  }
  if (roll) {
    const rlow = roll.toLowerCase()
    apps = apps.filter(a => {
      const data: any = (a as any).data || {}
      const admission = data.admission || {}
      const ar = String(admission.roll || '').toLowerCase()
      return ar === rlow || !roll
    })
  }
  if (!apps.length) {
    return NextResponse.json({ ok: false, details: null })
  }
  // Use latest by createdAt
  const app = apps
    .slice()
    .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0] as any

  const data = app.data || {}
  const health = data.health || {}
  const admission = data.admission || {}
  const student = data.student || {}
  const guardians = data.guardians || {}
  const address = data.address || {}

  const details = {
    admissionNumber: String(admission.roll || admission.admissionNumber || ''),
    dob: String(student.dob || ''),
    bloodGroup: String(health.bloodGroup || ''),
    fatherName: String(guardians.father || ''),
    fatherPhone: String(guardians.fatherPhone || app.parentPhone || ''),
    motherName: String(guardians.mother || ''),
    motherPhone: String(guardians.motherPhone || ''),
    address: String(address.permanent || address.correspondence || '')
  }

  return NextResponse.json({ ok: true, details })
}
