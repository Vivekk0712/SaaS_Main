import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  const app = db.applications.find(a => a.id === params.id)
  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const fee = db.fees.find(f => f.appId === params.id) || null
  return NextResponse.json({ application: app, fee })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { application } = await req.json().catch(() => ({}))
  if (!application || typeof application !== 'object') return NextResponse.json({ error: 'application_required' }, { status: 400 })
  const db = readDB()
  const app = db.applications.find(a => a.id === params.id)
  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  app.data = application
  ;(app as any).updatedAt = new Date().toISOString()
  writeDB(db)
  return NextResponse.json({ ok: true })
}
