import { NextResponse } from 'next/server'

const RAG_PLUGIN_URL = process.env.RAG_PLUGIN_URL || 'http://localhost:4000'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    
    // Forward to RAG plugin with test token for development
    const response = await fetch(`${RAG_PLUGIN_URL}/api/documents?studentId=${studentId}`, {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch documents' }))
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('id')
    
    // Forward to RAG plugin with test token for development
    const response = await fetch(`${RAG_PLUGIN_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete document' }))
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
