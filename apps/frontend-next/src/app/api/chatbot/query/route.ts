import { NextResponse } from 'next/server'

const RAG_PLUGIN_URL = process.env.RAG_PLUGIN_URL || 'http://localhost:4000'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Forward to RAG plugin with test token for development
    const response = await fetch(`${RAG_PLUGIN_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Query failed' }))
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}
