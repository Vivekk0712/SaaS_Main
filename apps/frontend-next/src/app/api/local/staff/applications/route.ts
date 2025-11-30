import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'submitted'
  const db = readDB()
  let items = [] as any[]
  if (status === 'approved') {
    items = db.applications.filter(a => a.status === 'admissions_confirmed' || a.status === 'fees_set')
  } else {
    items = db.applications.filter(a => a.status === status)
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ items })
}
