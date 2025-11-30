import { NextResponse } from 'next/server'
import { resetDB } from '../../_lib/filedb'

export async function DELETE() {
  try { resetDB() } catch {}
  return NextResponse.json({ ok: true, wiped: true })
}

