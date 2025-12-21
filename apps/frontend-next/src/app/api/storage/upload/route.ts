import { NextRequest, NextResponse } from 'next/server'
import { uploadToB2 } from '@/lib/backblaze'

const RAG_PLUGIN_URL = process.env.RAG_PLUGIN_URL || 'http://localhost:4000'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const klass = formData.get('klass') as string
    const section = formData.get('section') as string
    const subject = formData.get('subject') as string
    const type = formData.get('type') as 'textbook' | 'material'
    const chapterId = formData.get('chapterId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'no_file', message: 'No file provided' },
        { status: 400 }
      )
    }

    if (!klass || !section || !subject || !type) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Class, section, subject, and type are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Backblaze B2
    const result = await uploadToB2(buffer, file.name, {
      klass,
      section,
      subject,
      type,
      chapterId: chapterId || undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'upload_failed', message: result.error || 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Also send to RAG plugin for processing (only for PDFs)
    let ragProcessed = false
    if (file.type === 'application/pdf') {
      try {
        const ragFormData = new FormData()
        // Recreate the file from buffer
        const pdfBlob = new Blob([buffer], { type: 'application/pdf' })
        const pdfFile = new File([pdfBlob], file.name, { type: 'application/pdf' })
        
        ragFormData.append('file', pdfFile)
        ragFormData.append('metadata', JSON.stringify({
          klass,
          section,
          subject,
          chapterId: chapterId || '',
          type,
          b2Key: result.b2Key,
          filename: file.name,
        }))

        const ragResponse = await fetch(`${RAG_PLUGIN_URL}/api/upload`, {
          method: 'POST',
          body: ragFormData,
        })

        if (ragResponse.ok) {
          ragProcessed = true
          console.log('PDF sent to RAG plugin for processing')
        } else {
          console.error('Failed to send PDF to RAG plugin:', await ragResponse.text())
        }
      } catch (ragError) {
        console.error('Error sending to RAG plugin:', ragError)
        // Don't fail the whole upload if RAG processing fails
      }
    }

    return NextResponse.json({
      success: true,
      b2Key: result.b2Key,
      b2Path: result.b2Path,
      fileSize: result.fileSize,
      filename: file.name,
      ragProcessed,
      message: ragProcessed 
        ? 'File uploaded successfully and sent for AI processing' 
        : 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to process upload' },
      { status: 500 }
    )
  }
}

// Set max file size to 50MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
