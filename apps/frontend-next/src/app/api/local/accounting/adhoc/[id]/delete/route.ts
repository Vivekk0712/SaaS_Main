import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  db.adhocFees = (db.adhocFees || []).filter((x) => x.id !== params.id)
  writeDB(db)
  return NextResponse.json({ ok: true })
}

