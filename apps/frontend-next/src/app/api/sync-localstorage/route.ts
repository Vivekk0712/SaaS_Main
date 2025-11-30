import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Fetch students from the profiles API
    const response = await fetch('http://localhost:3002/api/local/profiles/students')
    const data = await response.json()
    const students = data.items || []
    
    // Convert to legacy format expected by teacher pages
    const legacyStudents = students.map((student: any) => ({
      usn: student.roll,
      name: student.name,
      klass: student.grade.replace('CLASS ', 'Class '),
      section: student.section
    }))
    
    // Return the data that should be stored in localStorage
    return NextResponse.json({ 
      success: true, 
      students: legacyStudents,
      message: 'Students converted to legacy format successfully'
    })
    
  } catch (error) {
    console.error('Error syncing localStorage:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}