import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../_lib/db'

const WHATSAPP_PLUGIN_URL = process.env.WHATSAPP_PLUGIN_URL || 'http://localhost:4100'

interface AttendanceNotifyRequest {
  date: string
  klass: string
  section: string
  hour: number
}

interface StudentWithParent {
  usn: string
  student_name: string
  parent_phone: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body: AttendanceNotifyRequest = await req.json()
    const { date, klass, section, hour } = body

    if (!date || !klass || !section || !hour) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Date, class, section, and hour are required' },
        { status: 400 }
      )
    }

    // Get attendance data from localStorage (passed from client)
    const attendanceData = body as any
    const absentStudents = attendanceData.absentStudents as string[] || []

    if (absentStudents.length === 0) {
      return NextResponse.json(
        { success: true, sent: 0, skipped: 0, message: 'No absent students to notify' },
        { status: 200 }
      )
    }

    // Fetch student details with parent phone numbers from database
    const placeholders = absentStudents.map(() => '?').join(',')
    const sql = `
      SELECT 
        s.usn,
        s.name as student_name,
        p.phone as parent_phone
      FROM students s
      LEFT JOIN parents p ON s.guardian_id = p.id
      WHERE s.usn IN (${placeholders})
        AND s.status = 'active'
    `

    const students = await query<StudentWithParent>(sql, absentStudents)

    // Filter students with valid phone numbers
    const studentsWithPhone = students.filter(s => s.parent_phone && s.parent_phone.trim())
    const studentsWithoutPhone = students.filter(s => !s.parent_phone || !s.parent_phone.trim())

    if (studentsWithPhone.length === 0) {
      return NextResponse.json(
        {
          success: false,
          sent: 0,
          skipped: students.length,
          message: 'No parent phone numbers found for absent students'
        },
        { status: 200 }
      )
    }

    // Format date for display (e.g., "12 December 2025")
    const dateObj = new Date(date)
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Prepare WhatsApp message job
    const recipients = studentsWithPhone.map(student => ({
      phone: student.parent_phone!,
      substitutions: {
        student_name: student.student_name,
        status: 'Absent',
        date: formattedDate
      }
    }))

    // Call WhatsApp plugin
    const whatsappResponse = await fetch(`${WHATSAPP_PLUGIN_URL}/api/v1/message-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bulk',
        templateName: 'attendance_alert',
        language: 'en',
        tenantId: 'school',
        payload: {
          status: 'Absent',
          date: formattedDate
        },
        recipients
      })
    })

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text().catch(() => 'Unknown error')
      console.error('WhatsApp plugin error:', errorText)
      return NextResponse.json(
        {
          error: 'whatsapp_api_error',
          message: 'Failed to send WhatsApp notifications',
          details: errorText.slice(0, 200)
        },
        { status: 502 }
      )
    }

    const whatsappResult = await whatsappResponse.json()

    return NextResponse.json({
      success: true,
      sent: studentsWithPhone.length,
      skipped: studentsWithoutPhone.length,
      message: `Notifications sent to ${studentsWithPhone.length} parent(s)`,
      details: {
        sent: studentsWithPhone.map(s => ({ usn: s.usn, name: s.student_name })),
        skipped: studentsWithoutPhone.map(s => ({ usn: s.usn, name: s.student_name, reason: 'No phone number' }))
      },
      whatsappResult
    })

  } catch (error) {
    console.error('Attendance notification error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to process attendance notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
