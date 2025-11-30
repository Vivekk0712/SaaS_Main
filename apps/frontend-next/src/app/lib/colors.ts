// Shared color helpers for consistent, dynamic color assignment
export type ColorTag = 'blue' | 'green' | 'orange' | 'pink' | 'violet'
export const COLOR_TAGS: ReadonlyArray<ColorTag> = ['blue','green','orange','pink','violet'] as const

export function subjectColor(subject: string): ColorTag {
  const key = (subject || '').trim().toLowerCase()
  const h = Array.from(key).reduce((s, c) => s + c.charCodeAt(0), 0)
  return COLOR_TAGS[h % COLOR_TAGS.length] as ColorTag
}
