import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
})

const WHATSAPP_PLUGIN_URL = process.env.WHATSAPP_PLUGIN_URL || 'http://localhost:3002'

export async function POST(request: NextRequest) {
  try {
    const { klass, section, subject, date } = await request.json()

    if (!klass || !section || !subject || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: klass, section, subject, date' },
        { status: 400 }
      )
    }

    console.log(`Fetching students for assignment notification: ${klass} ${section} - ${subject}`)

    // Get class_id
    const classResult = await pool.query<any[]>(
      'SELECT id FROM classes WHERE name = ?',
      [klass]
    )
    
    if (!Array.isArray(classResult[0]) || classResult[0].length === 0) {
      return NextResponse.json(
        { error: 'Class not found', klass },
        { status: 404 }
      )
    }
    const classId = classResult[0][0].id

    // Get section_id
    const sectionResult = await pool.query<any[]>(
      'SELECT id FROM sections WHERE class_id = ? AND name = ?',
      [classId, section]
    )
    
    if (!Array.isArray(sectionResult[0]) || sectionResult[0].length === 0) {
      return NextResponse.json(
        { error: 'Section not found', section },
        { status: 404 }
      )
    }
    const sectionId = sectionResult[0][0].id

    // Get students with parent phone numbers
    const studentsResult = await pool.query<any[]>(
      `SELECT 
        s.usn,
        s.name as student_name,
        p.phone as parent_phone,
        p.name as parent_name
       FROM students s
       LEFT JOIN parents p ON s.guardian_id = p.id
       WHERE s.class_id = ? AND s.section_id = ? AND s.status = 'active'`,
      [classId, sectionId]
    )

    const students = Array.isArray(studentsResult[0]) ? studentsResult[0] : []
    
    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No students found in this class/section',
        sent: 0,
        skipped: 0,
        failed: 0
      })
    }

    console.log(`Found ${students.length} students`)

    // Prepare notifications
    const notifications: Array<{
      phone: string
      studentName: string
      parentName: string
    }> = []

    let skippedCount = 0

    for (const student of students) {
      if (!student.parent_phone) {
        console.log(`Skipping ${student.student_name} - no parent phone`)
        skippedCount++
        continue
      }

      notifications.push({
        phone: student.parent_phone,
        studentName: student.student_name,
        parentName: student.parent_name || 'Parent'
      })
    }

    if (notifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No parent phone numbers available',
        sent: 0,
        skipped: skippedCount,
        failed: 0
      })
    }

    console.log(`Sending notifications to ${notifications.length} parents`)

    // Send WhatsApp notifications
    let sentCount = 0
    let failedCount = 0

    for (const notification of notifications) {
      try {
        const response = await fetch(`${WHATSAPP_PLUGIN_URL}/api/whatsapp/send-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: notification.phone,
            template: 'assignment_update',
            language: 'en',
            parameters: [
              subject,                    // {{1}} Subject
              `${klass} - ${section}`,   // {{2}} Class
              date                        // {{3}} Date
            ]
          })
        })

        if (response.ok) {
          sentCount++
          console.log(`✓ Sent to ${notification.phone} (${notification.parentName})`)
        } else {
          failedCount++
          const error = await response.text()
          console.error(`✗ Failed to send to ${notification.phone}:`, error)
        }
      } catch (error) {
        failedCount++
        console.error(`✗ Error sending to ${notification.phone}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent successfully`,
      sent: sentCount,
      skipped: skippedCount,
      failed: failedCount,
      total: students.length
    })

  } catch (error) {
    console.error('Assignment notification error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
