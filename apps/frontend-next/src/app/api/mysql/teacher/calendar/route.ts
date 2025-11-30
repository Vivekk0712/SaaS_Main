import { NextResponse } from 'next/server'
import { query } from '../../../_lib/db'

async function ensureScopedColumns() {
  try {
    const cols = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calendar_events'
           AND COLUMN_NAME IN ('class_id','section_id')`
    )
    const present = cols && cols[0] ? Number(cols[0].cnt || 0) : 0
    if (present < 2) {
      // Add nullable class/section columns for class-wise scoping
      await query(
        `ALTER TABLE calendar_events
           ADD COLUMN IF NOT EXISTS class_id BIGINT UNSIGNED NULL AFTER ymd,
           ADD COLUMN IF NOT EXISTS section_id BIGINT UNSIGNED NULL AFTER class_id,
           ADD INDEX IF NOT EXISTS idx_cal_class_section (class_id, section_id)`
      ) as any
      // Add FKs best-effort (ignore if already exist)
      try { await query(`ALTER TABLE calendar_events ADD CONSTRAINT fk_cal_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL`) } catch {}
      try { await query(`ALTER TABLE calendar_events ADD CONSTRAINT fk_cal_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL`) } catch {}
    }
  } catch {}
}

export async function GET(req: Request) {
  try {
    await ensureScopedColumns()
    const { searchParams } = new URL(req.url)
    const d = searchParams.get('date')
    const ym = searchParams.get('ym')
    const includeGlobal = (searchParams.get('includeGlobal') ?? '1') === '1'
    const klass = searchParams.get('klass') || ''
    const section = searchParams.get('section') || ''

    let classId: number | null = null
    let sectionId: number | null = null
    if (klass) {
      const cls = await query<{ id: number }>('SELECT id FROM classes WHERE name=? LIMIT 1', [klass])
      if (cls.length) classId = cls[0].id
      if (classId && section) {
        const sec = await query<{ id: number }>('SELECT id FROM sections WHERE class_id=? AND name=? LIMIT 1', [classId, section])
        if (sec.length) sectionId = sec[0].id
      }
    }
    if (d) {
      const params: any[] = [d]
      let where = 'ymd=?'
      if (classId) {
        params.push(classId)
        if (includeGlobal) {
          where += ' AND (class_id IS NULL OR class_id=?)'
          if (sectionId) { params.push(sectionId); where += ' AND (section_id IS NULL OR section_id=?)' }
        } else {
          where += ' AND class_id=?'
          if (sectionId) { params.push(sectionId); where += ' AND section_id=?' }
        }
      }
      const rows = await query<any>(
        `SELECT DATE_FORMAT(ymd,'%Y-%m-%d') AS date, title, tag, color, description,
                class_id, section_id
           FROM calendar_events
          WHERE ${where} ORDER BY id DESC`,
        params
      )
      return NextResponse.json({ items: rows })
    } else if (ym) {
      const params: any[] = [ym]
      let where = `DATE_FORMAT(ymd,'%Y-%m')=?`
      if (classId) {
        params.push(classId)
        if (includeGlobal) {
          where += ' AND (class_id IS NULL OR class_id=?)'
          if (sectionId) { params.push(sectionId); where += ' AND (section_id IS NULL OR section_id=?)' }
        } else {
          where += ' AND class_id=?'
          if (sectionId) { params.push(sectionId); where += ' AND section_id=?' }
        }
      }
      const rows = await query<any>(
        `SELECT DATE_FORMAT(ymd,'%Y-%m-%d') AS date, title, tag, color, description,
                class_id, section_id
           FROM calendar_events
          WHERE ${where} ORDER BY id DESC`,
        params
      )
      return NextResponse.json({ items: rows })
    }
    return NextResponse.json({ items: [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    await ensureScopedColumns()
    const body = await req.json()
    const date = String(body.date || '')
    const title = String(body.title || '')
    const tag = String(body.tag || 'EVENT')
    const color = String(body.color || 'blue')
    const description = String(body.description || '')
    const klass = String(body.klass || '')
    const section = String(body.section || '')
    if (!date || !title) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    let classId: number | null = null
    let sectionId: number | null = null
    if (klass) {
      const cls = await query<{ id:number }>('SELECT id FROM classes WHERE name=? LIMIT 1', [klass])
      if (cls.length) classId = cls[0].id
      if (classId && section) {
        const sec = await query<{ id:number }>('SELECT id FROM sections WHERE class_id=? AND name=? LIMIT 1', [classId, section])
        if (sec.length) sectionId = sec[0].id
      }
    }
    if (classId) {
      await query(
        `INSERT INTO calendar_events (ymd, class_id, section_id, title, tag, color, description)
         VALUES (?,?,?,?,?,?,?)`,
        [date, classId, sectionId, title, tag, color, description]
      )
    } else {
      await query(
        `INSERT INTO calendar_events (ymd, title, tag, color, description) VALUES (?,?,?,?,?)`,
        [date, title, tag, color, description]
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

