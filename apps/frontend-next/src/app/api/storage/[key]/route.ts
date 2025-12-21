import { NextRequest, NextResponse } from 'next/server'
import { getSignedUrlForB2 } from '@/lib/backblaze'

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params
    
    if (!key) {
      return NextResponse.json(
        { error: 'missing_key', message: 'File key is required' },
        { status: 400 }
      )
    }

    // Decode the key (it might be URL encoded)
    const decodedKey = decodeURIComponent(key)

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrlForB2(decodedKey, 3600)

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Signed URL API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}
