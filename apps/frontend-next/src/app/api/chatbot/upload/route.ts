import { NextResponse } from 'next/server'

const RAG_PLUGIN_URL = process.env.RAG_PLUGIN_URL || 'http://localhost:4000'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    // Forward to RAG plugin with test token for development
    const response = await fetch(`${RAG_PLUGIN_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
