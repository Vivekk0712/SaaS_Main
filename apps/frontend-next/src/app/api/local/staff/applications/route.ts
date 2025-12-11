import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'
import { query } from '../../../_lib/db'

// Pull newly-submitted applications from MySQL `applications` table
// (written by the 3020 onboarding app) into the local file DB so that
// the existing admissions / principal / accountant dashboards continue
// to work without schema changes.
async function syncFromMySqlIntoFileDb() {
  let rows: any[] = []
  try {
    rows = await query<any>(
      'SELECT id, applicant_name, parent_phone, grade_applied, section_pref, status, data_json, created_at FROM applications ORDER BY created_at DESC'
    )
  } catch {
    // If MySQL is not available, silently fall back to file DB only.
    return
  }
  if (!rows.length) return

  const db = readDB()
  db.applications = db.applications || []
  const existingById = new Map<string, any>(db.applications.map((a: any) => [String(a.id), a]))

  let changed = false
  for (const row of rows) {
    const id = String(row.id)
    const existing = existingById.get(id)
    const createdAt =
      (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || '')) ||
      new Date().toISOString()
    const data = row.data_json && typeof row.data_json === 'string' ? JSON.parse(row.data_json) : row.data_json || {}
    const mappedStatus = row.status === 'confirmed' ? 'admissions_confirmed' : 'submitted'

    if (!existing) {
      db.applications.push({
        id,
        parentPhone: row.parent_phone,
        grade: row.grade_applied,
        section: row.section_pref,
        status: mappedStatus,
        createdAt,
        updatedAt: createdAt,
        data,
      })
      changed = true
    }
  }

  if (changed) {
    // Persist and bump meta version so dashboards refresh.
    writeDB(db)
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'submitted'

  await syncFromMySqlIntoFileDb()

  const db = readDB()
  let items = [] as any[]
  if (status === 'approved') {
    items = db.applications.filter(
      (a: any) => a.status === 'admissions_confirmed' || a.status === 'fees_set' || a.status === 'approved'
    )
  } else {
    items = db.applications.filter((a: any) => a.status === status)
  }
  items.sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))

  return NextResponse.json({ items })
}
