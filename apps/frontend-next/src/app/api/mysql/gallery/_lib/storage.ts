import path from 'path'
import { promises as fs } from 'fs'

export type StoredImage = {
  urlPath: string
}

async function existsDir(dirPath: string) {
  try {
    const stat = await fs.stat(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

export async function resolvePublicDir() {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, 'public'),
    path.join(cwd, 'apps', 'frontend-next', 'public'),
    path.join(cwd, '..', 'public'),
    path.join(cwd, '..', '..', 'public'),
  ]
  for (const candidate of candidates) {
    if (await existsDir(candidate)) return candidate
  }
  // Default: assume we're running from `apps/frontend-next`
  return path.join(cwd, 'public')
}

function mimeToExt(mime: string) {
  const m = mime.toLowerCase()
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg'
  if (m === 'image/png') return 'png'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/gif') return 'gif'
  return 'png'
}

export function decodeDataUrl(dataUrl: string) {
  const trimmed = (dataUrl || '').trim()
  const match = /^data:([^;]+);base64,(.+)$/i.exec(trimmed)
  if (!match) return null
  const mime = match[1]
  const base64 = match[2]
  try {
    const buffer = Buffer.from(base64, 'base64')
    return { mime, buffer }
  } catch {
    return null
  }
}

export async function storeGalleryImageToPublic(opts: {
  dataUrl: string
  fileBaseName: string
  maxBytes?: number
}): Promise<StoredImage> {
  const decoded = decodeDataUrl(opts.dataUrl)
  if (!decoded) throw new Error('invalid_data_url')

  const maxBytes = opts.maxBytes ?? 15 * 1024 * 1024
  if (decoded.buffer.length > maxBytes) throw new Error('file_too_large')

  const ext = mimeToExt(decoded.mime)
  const filename = `${opts.fileBaseName}.${ext}`

  const publicRoot = await resolvePublicDir()
  const publicDir = path.join(publicRoot, 'uploads', 'gallery')
  await fs.mkdir(publicDir, { recursive: true })

  const filePath = path.join(publicDir, filename)
  await fs.writeFile(filePath, decoded.buffer)

  return { urlPath: `/uploads/gallery/${filename}` }
}

export async function deleteGalleryFileByUrl(urlPath: string) {
  const trimmed = String(urlPath || '').trim()
  if (!trimmed.startsWith('/uploads/gallery/')) return false
  const filename = trimmed.slice('/uploads/gallery/'.length)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false
  const publicRoot = await resolvePublicDir()
  const filePath = path.join(publicRoot, 'uploads', 'gallery', filename)
  try {
    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}
