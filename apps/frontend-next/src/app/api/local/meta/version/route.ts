import { NextResponse } from 'next/server'
import { readDB } from '../../_lib/filedb'

export async function GET() {
  const db = readDB()
  const meta = (db as any).meta || { version: 0, updatedAt: '' }
  return NextResponse.json(meta)
}
