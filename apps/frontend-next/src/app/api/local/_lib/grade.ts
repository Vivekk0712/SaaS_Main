export function gradeToSAS(input: string): string {
  const g = String(input || '').trim()
  if (!g) return ''
  if (/^\d+$/.test(g)) return `Class ${g}`
  const upper = g.toUpperCase()
  if (['NURSERY', 'LKG', 'UKG'].includes(upper)) return upper
  if (/^Class\s+\d+$/i.test(g)) return g.replace(/^\w/, c => c.toUpperCase())
  const m = g.match(/^class\s*(\d+)$/i)
  if (m) return `Class ${m[1]}`
  return g
}

export function gradeFromSAS(input: string): string {
  const s = String(input || '').trim()
  if (!s) return ''
  const m = s.match(/^class\s*(\d+)$/i)
  if (m) return m[1]
  return s
}

