import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET() {
  try {
    const rows = await query<{ name: string }>('SELECT name FROM classes ORDER BY name ASC')
    const items = rows.map(r => r.name)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

