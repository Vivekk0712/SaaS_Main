export type ImageOrientation = 'portrait' | 'landscape' | 'square'

export async function detectImageOrientation(src: string): Promise<ImageOrientation> {
  const url = String(src || '').trim()
  if (!url) return 'portrait'
  return await new Promise<ImageOrientation>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.loading = 'eager'
    img.onload = () => {
      const w = Number(img.naturalWidth || 0)
      const h = Number(img.naturalHeight || 0)
      if (!w || !h) return resolve('portrait')
      if (w === h) return resolve('square')
      return resolve(w > h ? 'landscape' : 'portrait')
    }
    img.onerror = () => resolve('portrait')
    img.src = url
  })
}

