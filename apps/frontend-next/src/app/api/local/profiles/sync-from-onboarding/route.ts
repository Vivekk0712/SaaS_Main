import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../_lib/filedb'
import { gradeToSAS } from '../../_lib/grade'

export async function POST() {
  try {
    const db = readDB()
    const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || 'http://localhost:3005'
    
    // Fetch confirmed applications from onboarding service
    const response = await fetch(`${API}/v1/onboarding/staff/applications?status=admissions_confirmed`, {
      headers: { 'x-role': 'admissions', 'x-password': '12345' }
    })
    
    if (!response.ok) {
      return NextResponse.json({ error: 'failed_to_fetch_applications' }, { status: 500 })
    }
    
    const data = await response.json()
    const applications = data.items || []
    
    // Get existing students to avoid duplicates
    const existingStudents = db.profiles?.students || []
    const existingMap = new Map(existingStudents.map(s => [`${s.name}-${s.fatherPhone}`, s]))
    
    // Create new student profiles from confirmed applications
    const newStudents = applications
      .filter((app: any) => app.data?.student && app.data?.admission)
      .map((app: any) => {
        const studentData = app.data.student
        const admissionData = app.data.admission
        const parentPhone = app.parentPhone || app.data.student?.fatherPhone
        
        return {
          name: studentData.name || studentData.studentName || '',
          fatherPhone: parentPhone || '',
          grade: gradeToSAS(admissionData.grade || ''),
          section: admissionData.section || '',
          roll: admissionData.roll || '',
          photoDataUrl: studentData.photoDataUrl || '',
          password: studentData.password || '',
          appId: app._id || app.id
        }
      })
      .filter((student: any) => student.name && student.fatherPhone)
      .filter((student: any) => !existingMap.has(`${student.name}-${student.fatherPhone}`))
    
    // Add new students to existing ones
    const updatedStudents = [...existingStudents, ...newStudents]
    
    // Update database
    db.profiles = db.profiles || { parents: [], students: [] }
    db.profiles.students = updatedStudents
    writeDB(db)
    
    return NextResponse.json({ 
      ok: true, 
      synced: newStudents.length,
      total: updatedStudents.length 
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'sync_failed' }, { status: 500 })
  }
}