import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const klass = searchParams.get('klass') || ''
    const section = searchParams.get('section') || ''
    let sql = `SELECT t.name AS teacher, s.name AS subject, c.name AS klass, sec.name AS section
                 FROM teaching_assignments ta
                 JOIN teachers t ON t.id = ta.teacher_id
                 JOIN subjects s ON s.id = ta.subject_id
                 JOIN classes c  ON c.id = ta.class_id
                 JOIN sections sec ON sec.id = ta.section_id`
    const params: any[] = []
    const where: string[] = []
    if (klass) { where.push('c.name = ?'); params.push(klass) }
    if (section) { where.push('sec.name = ?'); params.push(section) }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY c.name, sec.name, s.name'
    const rows = await query<{ teacher:string; subject:string; klass:string; section:string }>(sql, params)
    return NextResponse.json({ items: rows })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

