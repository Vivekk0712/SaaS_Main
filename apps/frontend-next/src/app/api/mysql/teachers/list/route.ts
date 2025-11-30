import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET() {
  try {
    const rows = await query<{ name:string; subject:string }>(
      `SELECT t.name AS name, s.name AS subject
         FROM teaching_assignments ta
         JOIN teachers t ON t.id = ta.teacher_id
         JOIN subjects s ON s.id = ta.subject_id`
    )
    const map = new Map<string, Set<string>>()
    for (const r of rows) {
      const key = r.name
      if (!map.has(key)) map.set(key, new Set<string>())
      if (r.subject) map.get(key)!.add(r.subject)
    }
    const items = Array.from(map.entries()).map(([name, subs]) => ({ name, subjects: Array.from(subs.values()) }))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

