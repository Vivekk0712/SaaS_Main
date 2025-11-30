import { NextResponse } from 'next/server'
import { resetDB } from '../../_lib/filedb'

export async function POST() {
  try { resetDB() } catch {}
  return NextResponse.json({ ok: true })
}

