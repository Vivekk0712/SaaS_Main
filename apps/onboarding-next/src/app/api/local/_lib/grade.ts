export function gradeToSAS(input: string): string {
  const g = String(input || '').trim()
  if (!g) return ''
  if (/^\d+$/.test(g)) return `CLASS ${g}`
  const upper = g.toUpperCase()
  if (['NURSERY', 'LKG', 'UKG'].includes(upper)) return upper
  if (/^CLASS\s+\d+$/i.test(g)) return g.toUpperCase().replace(/\s+/, ' ')
  const m = g.match(/^class\s*(\d+)$/i)
  if (m) return `CLASS ${m[1]}`
  return g
}

export function gradeFromSAS(input: string): string {
  const s = String(input || '').trim()
  if (!s) return ''
  const m = s.match(/^class\s*(\d+)$/i)
  if (m) return m[1]
  return s
}

