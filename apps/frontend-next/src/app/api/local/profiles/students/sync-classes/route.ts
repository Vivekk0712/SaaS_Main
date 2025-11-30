import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'
import { gradeToSAS } from '../../../_lib/grade'

export async function POST(req: Request) {
  const db = readDB()
  const list = db.profiles?.students || []
  
  // Update all student grades to match HOD class naming
  list.forEach(student => {
    if (student.grade) {
      student.grade = gradeToSAS(student.grade)
    }
  })
  
  db.profiles = db.profiles || { parents: [], students: [] }
  db.profiles.students = list
  writeDB(db)
  
  return NextResponse.json({ ok: true, updated: list.length })
}
