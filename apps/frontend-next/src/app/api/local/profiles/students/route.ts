import { NextResponse } from 'next/server'
import { readDB } from '../../_lib/filedb'

export async function GET() {
  const db = readDB()
  const parents = db.profiles?.parents || []
  const items = (db.profiles?.students || []).map(s => ({
    name: s.name,
    grade: s.grade || '',
    section: s.section || '',
    roll: s.roll || '',
    fatherPhone: s.fatherPhone || '',
    parentName: parents.find(p => p.phone === s.fatherPhone)?.parentName || '',
    photo: s.photoDataUrl || ''
  }))
  return NextResponse.json({ items })
}
