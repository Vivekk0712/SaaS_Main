import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_PLUGIN_URL = process.env.WHATSAPP_PLUGIN_URL || 'http://localhost:4100'

// Test endpoint - only sends to 2 real phone numbers
export async function POST(request: NextRequest) {
    try {
        const { subject, date } = await request.json()

        const klass = 'CLASS 1'
        const section = 'A'
        const subjectName = subject || 'Physics'
        const dateStr = date || new Date().toISOString().split('T')[0]

        console.log(`TEST: Sending notifications for ${subjectName} - ${klass} ${section}`)

        // Only these 2 real phone numbers
        const testRecipients = [
            {
                phone: '918850623515',
                name: 'Ananya Gupta',
                student: 'Aditya Kumar (1A01)'
            },
            {
                phone: '919867805724',
                name: 'Rahul Nair',
                student: 'Nisha Naik (1A02)'
            }
        ]

        let sentCount = 0
        let failedCount = 0

        for (const recipient of testRecipients) {
            try {
                console.log(`Sending to ${recipient.phone} (${recipient.name})...`)

                const response = await fetch(`${WHATSAPP_PLUGIN_URL}/api/v1/message-jobs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tenantId: 'school-erp',
                        type: 'transactional',
                        templateName: 'assignment_update',
                        language: 'en',
                        payload: {
                            '1': subjectName,
                            '2': `${klass} - ${section}`,
                            '3': dateStr
                        },
                        recipients: [{
                            phone: recipient.phone,
                            name: recipient.name
                        }],
                        priority: 'normal'
                    })
                })

                if (response.ok) {
                    const result = await response.json()
                    sentCount++
                    console.log(`✓ Sent to ${recipient.phone} (${recipient.name})`, result)
                } else {
                    failedCount++
                    const error = await response.text()
                    console.error(`✗ Failed to send to ${recipient.phone}:`, error)
                }
            } catch (error) {
                failedCount++
                console.error(`✗ Error sending to ${recipient.phone}:`, error)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Test notifications sent`,
            sent: sentCount,
            failed: failedCount,
            total: testRecipients.length,
            recipients: testRecipients.map(r => ({
                phone: r.phone,
                name: r.name,
                student: r.student
            }))
        })

    } catch (error) {
        console.error('Test notification error:', error)
        return NextResponse.json(
            {
                error: 'Failed to send test notifications',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
