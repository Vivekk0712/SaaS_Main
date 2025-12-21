import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Backblaze B2 configuration
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com'
const B2_REGION = process.env.B2_REGION || 'us-west-004'
const B2_BUCKET = process.env.B2_BUCKET_NAME || ''
const B2_KEY_ID = process.env.B2_KEY_ID || ''
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || ''

if (!B2_BUCKET || !B2_KEY_ID || !B2_APPLICATION_KEY) {
  console.warn('⚠️ Backblaze B2 credentials not configured. File uploads will fail.')
}

// Create S3-compatible client for Backblaze B2
const s3Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
})

export interface UploadResult {
  success: boolean
  b2Key: string
  b2Path: string
  fileSize: number
  url?: string
  error?: string
}

/**
 * Upload a file to Backblaze B2
 * @param buffer File buffer
 * @param filename Original filename
 * @param metadata Additional metadata (class, section, subject, etc.)
 * @returns Upload result with B2 key and path
 */
export async function uploadToB2(
  buffer: Buffer,
  filename: string,
  metadata: {
    klass: string
    section: string
    subject: string
    type: 'textbook' | 'material'
    chapterId?: string
  }
): Promise<UploadResult> {
  try {
    // Generate unique key with timestamp
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const b2Key = `school-erp/${metadata.klass}/${metadata.section}/${metadata.subject}/${metadata.type}s/${timestamp}_${sanitizedFilename}`

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: b2Key,
      Body: buffer,
      ContentType: getContentType(filename),
      Metadata: {
        class: metadata.klass,
        section: metadata.section,
        subject: metadata.subject,
        type: metadata.type,
        chapterId: metadata.chapterId || '',
        uploadedAt: timestamp.toString(),
      },
    })

    await s3Client.send(command)

    return {
      success: true,
      b2Key,
      b2Path: `${B2_ENDPOINT}/${B2_BUCKET}/${b2Key}`,
      fileSize: buffer.length,
    }
  } catch (error) {
    console.error('Backblaze upload error:', error)
    return {
      success: false,
      b2Key: '',
      b2Path: '',
      fileSize: 0,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Get a signed URL for accessing a file from B2
 * @param b2Key The B2 key of the file
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrlForB2(b2Key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: b2Key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw error
  }
}

/**
 * Delete a file from B2
 * @param b2Key The B2 key of the file to delete
 * @returns Success status
 */
export async function deleteFromB2(b2Key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET,
      Key: b2Key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error('Error deleting from B2:', error)
    return false
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
  }
  return types[ext || ''] || 'application/octet-stream'
}

export { s3Client }
