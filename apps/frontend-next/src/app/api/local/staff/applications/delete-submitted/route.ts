import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'

export async function POST() {
  const db = readDB()
  const toDelete = new Set(db.applications.filter(a => a.status === 'submitted').map(a => a.id))
  const beforeApps = db.applications.length
  const beforeFees = db.fees.length
  db.applications = db.applications.filter(a => !toDelete.has(a.id))
  db.fees = db.fees.filter(f => !toDelete.has(f.appId))
  writeDB(db)
  return NextResponse.json({ ok: true, removed: { applications: beforeApps - db.applications.length, fees: beforeFees - db.fees.length } })
}

