import { NextResponse } from 'next/server'
import { readDB } from '../../_lib/filedb'

export async function GET() {
  const db = readDB()
  const items = db.fees
    .map(f => ({ ...f, app: db.applications.find(a => a.id === f.appId) }))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  return NextResponse.json({ items })
}

