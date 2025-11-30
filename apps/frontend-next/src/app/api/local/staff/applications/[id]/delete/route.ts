import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  const beforeApps = db.applications.length
  const beforeFees = db.fees.length
  db.applications = db.applications.filter((a) => a.id !== params.id)
  db.fees = db.fees.filter((f) => f.appId !== params.id)
  writeDB(db)
  return NextResponse.json({ ok: true, removed: { applications: beforeApps - db.applications.length, fees: beforeFees - db.fees.length } })
}

