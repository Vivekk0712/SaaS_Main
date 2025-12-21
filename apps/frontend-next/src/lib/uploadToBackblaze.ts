/**
 * Upload file to Backblaze B2 storage
 * Client-side helper function
 */

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  success: boolean
  b2Key: string
  b2Path: string
  fileSize: number
  filename: string
  error?: string
}

export async function uploadFileToB2(
  file: File,
  metadata: {
    klass: string
    section: string
    subject: string
    type: 'textbook' | 'material'
    chapterId?: string
  },
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        b2Key: '',
        b2Path: '',
        fileSize: 0,
        filename: file.name,
        error: 'File size exceeds 50MB limit',
      }
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('klass', metadata.klass)
    formData.append('section', metadata.section)
    formData.append('subject', metadata.subject)
    formData.append('type', metadata.type)
    if (metadata.chapterId) {
      formData.append('chapterId', metadata.chapterId)
    }

    // Upload with progress tracking
    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          })
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } catch {
            reject(new Error('Invalid response from server'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            resolve({
              success: false,
              b2Key: '',
              b2Path: '',
              fileSize: 0,
              filename: file.name,
              error: error.message || 'Upload failed',
            })
          } catch {
            resolve({
              success: false,
              b2Key: '',
              b2Path: '',
              fileSize: 0,
              filename: file.name,
              error: `Upload failed with status ${xhr.status}`,
            })
          }
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          b2Key: '',
          b2Path: '',
          fileSize: 0,
          filename: file.name,
          error: 'Network error during upload',
        })
      })

      // Send request
      xhr.open('POST', '/api/storage/upload')
      xhr.send(formData)
    })
  } catch (error) {
    return {
      success: false,
      b2Key: '',
      b2Path: '',
      fileSize: 0,
      filename: file.name,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Get signed URL for a B2 file
 */
export async function getSignedUrl(b2Key: string): Promise<string | null> {
  try {
    const encodedKey = encodeURIComponent(b2Key)
    const response = await fetch(`/api/storage/${encodedKey}`)
    
    if (!response.ok) {
      console.error('Failed to get signed URL:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.url || null
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return null
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
