import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'
import { gradeToSAS } from '../../../../_lib/grade'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  const app = db.applications.find(a => a.id === params.id)
  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  
  // Update application status
  app.status = 'admissions_confirmed'
  app.confirmedAt = new Date().toISOString()
  
  // Create student profile from confirmed application
  if (app.data?.student && app.data?.admission) {
    const studentData = app.data.student
    const admissionData = app.data.admission
    const parentPhone = app.parentPhone || app.data.student?.fatherPhone
    
    if (studentData.name && parentPhone) {
      // Check if student already exists
      const existingStudents = db.profiles?.students || []
      const studentExists = existingStudents.some(s => 
        s.name === studentData.name && s.fatherPhone === parentPhone
      )
      
      if (!studentExists) {
        // Create new student profile
        const newStudent = {
          name: studentData.name || studentData.studentName || '',
          fatherPhone: parentPhone || '',
          grade: gradeToSAS(admissionData.grade || ''),
          section: admissionData.section || '',
          roll: admissionData.roll || '',
          photoDataUrl: studentData.photoDataUrl || '',
          password: studentData.password || '',
          appId: app.id
        }
        
        // Add to profiles
        db.profiles = db.profiles || { parents: [], students: [] }
        db.profiles.students = [...existingStudents, newStudent]
      }
    }
  }
  
  writeDB(db)
  return NextResponse.json({ ok: true })
}

