import { NextRequest, NextResponse } from 'next/server'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:5003'

export async function POST(request: NextRequest) {
  try {
    const { question, role } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    console.log(`Database chat query (${role || 'teacher'}): ${question}`)

    // Forward the query to MCP server
    const response = await fetch(`${MCP_SERVER_URL}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In production, pass actual JWT token from session
        'Authorization': `Bearer ${process.env.MCP_JWT_TOKEN || 'dev-token'}`,
      },
      body: JSON.stringify({
        question: question,
        context: {
          role: role || 'teacher',
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MCP server error:', errorText)
      return NextResponse.json(
        { error: 'Database query failed', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      answer: data.answer || 'Query completed',
      intent: data.intent,
      confidence: data.confidence,
      rows_count: data.rows_count,
      sources: data.sources || []
    })

  } catch (error) {
    console.error('Database chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
