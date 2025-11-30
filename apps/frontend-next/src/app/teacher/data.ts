export type Teacher = { name: string; subject: string }
export type Student = { usn: string; name: string; klass: string; section: string }
export type EventColor = 'blue' | 'green' | 'orange'
export type CalendarEvent = {
  date: string // YYYY-MM-DD
  title: string
  tag: string
  color: EventColor
  description: string
  createdBy: string // teacher name
  // Optional scoping: if provided, event applies only to this class/section
  klass?: string
  section?: string
}

// Lightweight fetch throttle to avoid rapid repeated background refreshes
const __fetchGuard: Record<string, number> = {}
function shouldFetchOnce(key: string, intervalMs = 6000) {
  const now = Date.now()
  const last = __fetchGuard[key] || 0
  if (now - last < intervalMs) return false
  __fetchGuard[key] = now
  return true
}

export const CLASSES = ['Class 8', 'Class 9', 'Class 10'] as const
export const SECTIONS = ['A', 'B'] as const
export const HOURS = [1, 2, 3, 4, 5] as const
export const SUBJECTS = ['Kannada', 'English', 'Chemistry', 'Physics', 'Mathematics'] as const

export function getClasses(): string[] {
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce('academics:classes')) {
      fetch('/api/mysql/academics/classes').then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        localStorage.setItem('school:classes', JSON.stringify(j.items))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classes' } })) } catch {}
      }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:classes')
    if (raw !== null) {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    }
    return []
  } catch { return [] }
}

export function getSections(): string[] {
  // Union of all sections across classes; can be empty
  try {
    const rawMap = localStorage.getItem('school:classSections')
    if (rawMap !== null) {
      const map = JSON.parse(rawMap) as Record<string, string[]>
      const set = new Set<string>()
      Object.values(map || {}).forEach(arr => Array.isArray(arr) && arr.forEach(s => set.add(s)))
      return Array.from(set)
    }
  } catch {}
  try {
    const raw = localStorage.getItem('school:sections')
    if (raw !== null) {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    }
    return []
  } catch { return [] }
}

export function getSectionsForClass(klass: string): string[] {
  try {
    const key = `school:classSections`
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`academics:sections:${klass}`)) {
      fetch(`/api/mysql/academics/sections?klass=${encodeURIComponent(klass)}`).then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const rawMap = localStorage.getItem(key)
        const map = rawMap ? (JSON.parse(rawMap) as Record<string, string[]>) : {}
        map[klass] = j.items
        localStorage.setItem(key, JSON.stringify(map))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key } })) } catch {}
      }).catch(()=>{})
    }
    const rawMap = localStorage.getItem(key)
    const map = rawMap ? (JSON.parse(rawMap) as Record<string, string[]>) : {}
    const arr = map[klass]
    if (Array.isArray(arr) && arr.length) return arr
  } catch {}
  return getSections()
}

export function getSubjects(): string[] {
  // Server-backed subjects with local cache fallback
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce('academics:subjects')) {
      fetch('/api/mysql/academics/subjects').then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        localStorage.setItem('school:subjects', JSON.stringify(j.items))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:subjects' } })) } catch {}
      }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:subjects')
    if (raw !== null) {
      const arr = JSON.parse(raw)
      // Dedupe case-insensitively and trim
      if (Array.isArray(arr)) {
        const seen = new Set<string>()
        const out: string[] = []
        for (const s of arr) {
          const key = String(s || '').trim().toLowerCase()
          if (!key) continue
          if (!seen.has(key)) { seen.add(key); out.push(String(s).trim()) }
        }
        return out
      }
      return []
    }
    return []
  } catch { return [] }
}

export type Subject = typeof SUBJECTS[number]

export function subjectForHour(hour: number): string {
  const subs = getSubjects()
  if (Array.isArray(subs) && subs.length > 0) {
    const idx = Math.max(0, (Number(hour) - 1) % subs.length)
    return subs[idx]
  }
  return `Hour ${Number(hour) || 0}`
}

export function subjectForHourFor(klass: string, section: string, hour: number): string {
  const subs = getClassSubjects(klass, section)
  const list = (subs && subs.length) ? subs : getSubjects()
  if (Array.isArray(list) && list.length > 0) {
    const idx = Math.max(0, (Number(hour) - 1) % list.length)
    return list[idx]
  }
  return `Hour ${Number(hour) || 0}`
}

export const TEACHERS: Teacher[] = []

// Hard-coded 30 students (editable):
// Class 8 → 801–810 | A: 801–805, B: 806–810
// Class 9 → 901–910 | A: 901–905, B: 906–910
// Class 10 → 101–110 | A: 101–105, B: 106–110
export const STUDENTS: Student[] = [
  // Class 8 — Section A
  { usn: '801', name: 'Student 801', klass: 'Class 8', section: 'A' },
  { usn: '802', name: 'Student 802', klass: 'Class 8', section: 'A' },
  { usn: '803', name: 'Student 803', klass: 'Class 8', section: 'A' },
  { usn: '804', name: 'Student 804', klass: 'Class 8', section: 'A' },
  { usn: '805', name: 'Student 805', klass: 'Class 8', section: 'A' },
  // Class 8 — Section B
  { usn: '806', name: 'Student 806', klass: 'Class 8', section: 'B' },
  { usn: '807', name: 'Student 807', klass: 'Class 8', section: 'B' },
  { usn: '808', name: 'Student 808', klass: 'Class 8', section: 'B' },
  { usn: '809', name: 'Student 809', klass: 'Class 8', section: 'B' },
  { usn: '810', name: 'Student 810', klass: 'Class 8', section: 'B' },

  // Class 9 — Section A
  { usn: '901', name: 'Student 901', klass: 'Class 9', section: 'A' },
  { usn: '902', name: 'Student 902', klass: 'Class 9', section: 'A' },
  { usn: '903', name: 'Student 903', klass: 'Class 9', section: 'A' },
  { usn: '904', name: 'Student 904', klass: 'Class 9', section: 'A' },
  { usn: '905', name: 'Student 905', klass: 'Class 9', section: 'A' },
  // Class 9 — Section B
  { usn: '906', name: 'Student 906', klass: 'Class 9', section: 'B' },
  { usn: '907', name: 'Student 907', klass: 'Class 9', section: 'B' },
  { usn: '908', name: 'Student 908', klass: 'Class 9', section: 'B' },
  { usn: '909', name: 'Student 909', klass: 'Class 9', section: 'B' },
  { usn: '910', name: 'Student 910', klass: 'Class 9', section: 'B' },

  // Class 10 — Section A
  { usn: '101', name: 'Student 101', klass: 'Class 10', section: 'A' },
  { usn: '102', name: 'Student 102', klass: 'Class 10', section: 'A' },
  { usn: '103', name: 'Student 103', klass: 'Class 10', section: 'A' },
  { usn: '104', name: 'Student 104', klass: 'Class 10', section: 'A' },
  { usn: '105', name: 'Student 105', klass: 'Class 10', section: 'A' },
  // Class 10 — Section B
  { usn: '106', name: 'Student 106', klass: 'Class 10', section: 'B' },
  { usn: '107', name: 'Student 107', klass: 'Class 10', section: 'B' },
  { usn: '108', name: 'Student 108', klass: 'Class 10', section: 'B' },
  { usn: '109', name: 'Student 109', klass: 'Class 10', section: 'B' },
  { usn: '110', name: 'Student 110', klass: 'Class 10', section: 'B' }
]

export function seedIfNeeded() {
  const versionKey = 'school:seed:version'
  const desired = 'v4-empty-initial'
  const current = localStorage.getItem(versionKey)
  if (current !== desired) {
    if (localStorage.getItem('school:teachers') === null) localStorage.setItem('school:teachers', JSON.stringify([]))
    if (localStorage.getItem('school:students') === null) localStorage.setItem('school:students', JSON.stringify([]))
    if (localStorage.getItem('school:classes') === null) localStorage.setItem('school:classes', JSON.stringify([]))
    if (localStorage.getItem('school:sections') === null) localStorage.setItem('school:sections', JSON.stringify([]))
    if (localStorage.getItem('school:subjects') === null) localStorage.setItem('school:subjects', JSON.stringify([]))
    if (localStorage.getItem('school:classSections') === null) localStorage.setItem('school:classSections', JSON.stringify({}))
    if (localStorage.getItem('school:attendance') === null) localStorage.setItem('school:attendance', JSON.stringify({}))
    if (localStorage.getItem('school:diary') === null) localStorage.setItem('school:diary', JSON.stringify({}))
    if (localStorage.getItem('school:calendar') === null) localStorage.setItem('school:calendar', JSON.stringify({}))
    if (localStorage.getItem('school:classHours') === null) localStorage.setItem('school:classHours', JSON.stringify({}))
    if (localStorage.getItem('school:classSubjects') === null) localStorage.setItem('school:classSubjects', JSON.stringify({}))
    if (localStorage.getItem('school:circulars') === null) localStorage.setItem('school:circulars', JSON.stringify([]))
    if (localStorage.getItem('school:marks') === null) localStorage.setItem('school:marks', JSON.stringify([]))
    localStorage.setItem(versionKey, desired)
    return
  }
  if (!localStorage.getItem('school:teachers')) localStorage.setItem('school:teachers', JSON.stringify([]))
  if (!localStorage.getItem('school:students')) localStorage.setItem('school:students', JSON.stringify([]))
  if (!localStorage.getItem('school:classes')) localStorage.setItem('school:classes', JSON.stringify([]))
  if (!localStorage.getItem('school:sections')) localStorage.setItem('school:sections', JSON.stringify([]))
  if (!localStorage.getItem('school:subjects')) localStorage.setItem('school:subjects', JSON.stringify([]))
  if (!localStorage.getItem('school:classSections')) localStorage.setItem('school:classSections', JSON.stringify({}))
  if (!localStorage.getItem('school:attendance')) {
    localStorage.setItem('school:attendance', JSON.stringify({}))
  }
  if (!localStorage.getItem('school:diary')) {
    localStorage.setItem('school:diary', JSON.stringify({}))
  }
  if (!localStorage.getItem('school:calendar')) {
    localStorage.setItem('school:calendar', JSON.stringify({}))
  }
  if (!localStorage.getItem('school:classHours')) localStorage.setItem('school:classHours', JSON.stringify({}))
  if (!localStorage.getItem('school:classSubjects')) localStorage.setItem('school:classSubjects', JSON.stringify({}))
  if (!localStorage.getItem('school:circulars')) localStorage.setItem('school:circulars', JSON.stringify([]))
  if (!localStorage.getItem('school:marks')) localStorage.setItem('school:marks', JSON.stringify([]))
}

// ---- Class hours (per class) ----
export function getHoursForClass(klass: string): number {
  try {
    const raw = localStorage.getItem('school:classHours')
    const map = raw ? JSON.parse(raw) as Record<string, number> : {}
    const n = map?.[klass]
    const v = Number(n)
    if (!Number.isFinite(v) || v < 1) return HOURS.length
    return Math.min(12, Math.max(1, Math.floor(v)))
  } catch { return HOURS.length }
}

export function setHoursForClass(klass: string, count: number) {
  const v = Math.min(12, Math.max(1, Math.floor(Number(count))))
  try {
    const raw = localStorage.getItem('school:classHours')
    const map = raw ? JSON.parse(raw) as Record<string, number> : {}
    map[klass] = v
    localStorage.setItem('school:classHours', JSON.stringify(map))
  } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classHours' } })) } catch {}
}

export function hourOptionsForClass(klass: string): number[] {
  const n = getHoursForClass(klass)
  return Array.from({ length: n }, (_, i) => i + 1)
}

// Admin/HOD management helpers
export function getClassSubjects(klass: string, section: string): string[] {
  try {
    const key = `${klass}|${section}`
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`academics:classSubjects:${key}`)) {
      fetch(`/api/mysql/academics/class-subjects?klass=${encodeURIComponent(klass)}&section=${encodeURIComponent(section)}`)
        .then(r=>r.json()).then(j => {
          if (!j || !Array.isArray(j.items)) return
          const raw = localStorage.getItem('school:classSubjects')
          const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
          map[key] = j.items
          localStorage.setItem('school:classSubjects', JSON.stringify(map))
          try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSubjects' } })) } catch {}
        }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:classSubjects')
    const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
    const arr = map[key]
    if (!Array.isArray(arr)) return []
    // Dedupe case-insensitively and trim while preserving first seen case
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of arr) {
      const k = String(s || '').trim().toLowerCase()
      if (!k) continue
      if (!seen.has(k)) { seen.add(k); out.push(String(s).trim()) }
    }
    return out
  } catch { return [] }
}

export function addSubjectToClassSection(klass: string, section: string, name: string) {
  const key = `${klass}|${section}`
  try {
    const raw = localStorage.getItem('school:classSubjects')
    const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
    const arr = Array.isArray(map[key]) ? map[key] : []
    if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
    map[key] = arr
    localStorage.setItem('school:classSubjects', JSON.stringify(map))
  } catch {}
  try { if (typeof fetch !== 'undefined') { const raw = localStorage.getItem('school:classSubjects'); const map = raw? JSON.parse(raw): {}; const arr = map[key] || []; fetch('/api/local/academics/class-subjects', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ klass, section, items: arr }) }) } } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSubjects' } })) } catch {}
}

export function removeSubjectFromClassSection(klass: string, section: string, name: string) {
  const key = `${klass}|${section}`
  try {
    const raw = localStorage.getItem('school:classSubjects')
    const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
    const arr = Array.isArray(map[key]) ? map[key] : []
    map[key] = arr.filter(s => s.toLowerCase() !== name.toLowerCase())
    localStorage.setItem('school:classSubjects', JSON.stringify(map))
  } catch {}
  try { if (typeof fetch !== 'undefined') { const raw = localStorage.getItem('school:classSubjects'); const map = raw? JSON.parse(raw): {}; const arr = map[key] || []; fetch('/api/local/academics/class-subjects', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ klass, section, items: arr }) }) } } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSubjects' } })) } catch {}
}
export function addSubject(name: string) {
  const raw = localStorage.getItem('school:subjects')
  const arr: string[] = raw ? JSON.parse(raw) : getSubjects()
  if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
  localStorage.setItem('school:subjects', JSON.stringify(arr))
  try { if (typeof fetch !== 'undefined') fetch('/api/local/academics/subjects', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ items: arr }) }) } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:subjects' } })) } catch {}
}

export function addClass(name: string) {
  const raw = localStorage.getItem('school:classes')
  const arr: string[] = raw ? JSON.parse(raw) : getClasses()
  if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
  localStorage.setItem('school:classes', JSON.stringify(arr))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classes' } })) } catch {}
}

export function removeClass(name: string) {
  try {
    const raw = localStorage.getItem('school:classes')
    const arr: string[] = raw ? JSON.parse(raw) : []
    const next = arr.filter(c => c.toLowerCase() !== name.toLowerCase())
    localStorage.setItem('school:classes', JSON.stringify(next))
  } catch {}
  try {
    const rawMap = localStorage.getItem('school:classSections')
    const map: Record<string, string[]> = rawMap ? JSON.parse(rawMap) : {}
    if (name in map) {
      delete map[name]
      localStorage.setItem('school:classSections', JSON.stringify(map))
    }
  } catch {}
  try { if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classes' } }))
    window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSections' } }))
  } } catch {}
}

export function addSectionToClass(klass: string, name: string) {
  const rawMap = localStorage.getItem('school:classSections')
  const map: Record<string, string[]> = rawMap ? JSON.parse(rawMap) : {}
  const arr: string[] = Array.isArray(map[klass]) ? map[klass] : []
  if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
  map[klass] = arr
  localStorage.setItem('school:classSections', JSON.stringify(map))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSections' } })) } catch {}
}

export function removeSectionFromClass(klass: string, name: string) {
  const rawMap = localStorage.getItem('school:classSections')
  const map: Record<string, string[]> = rawMap ? JSON.parse(rawMap) : {}
  const arr: string[] = Array.isArray(map[klass]) ? map[klass] : []
  const next = arr.filter(s => s.toLowerCase() !== name.toLowerCase())
  map[klass] = next
  localStorage.setItem('school:classSections', JSON.stringify(map))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSections' } })) } catch {}
}

export type TeachingAssignment = { teacher: string; subject: string; klass: string; section: string }
export function listAssignments(): TeachingAssignment[] {
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce('hod:assignments')) {
      fetch('/api/mysql/hod/assignments').then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        localStorage.setItem('school:assignments', JSON.stringify(j.items))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:assignments' } })) } catch {}
      }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:assignments')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
export function saveAssignments(arr: TeachingAssignment[]) {
  try {
    if (typeof window === 'undefined') return
    const ls: any = (globalThis as any).localStorage
    if (!ls || typeof ls.setItem !== 'function') return
    ls.setItem('school:assignments', JSON.stringify(arr))
    try { window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:assignments' } })) } catch {}
  } catch {}
}

// ---- Assignment helpers (query) ----
export function getAssignmentsForTeacher(teacherName: string): TeachingAssignment[] {
  const all = listAssignments()
  return all.filter(a => a.teacher && a.teacher.toLowerCase() === teacherName.toLowerCase())
}

export function getAssignedClassesForTeacher(teacherName: string): string[] {
  const arr = getAssignmentsForTeacher(teacherName)
  const set = new Set<string>()
  arr.forEach(a => set.add(a.klass))
  return Array.from(set)
}

export function getAssignedSectionsForTeacher(teacherName: string, klass: string): string[] {
  const arr = getAssignmentsForTeacher(teacherName)
  const set = new Set<string>()
  arr.filter(a => a.klass === klass).forEach(a => set.add(a.section))
  return Array.from(set)
}

export function getAssignedSubjectsForTeacher(teacherName: string, klass?: string, section?: string): string[] {
  const arr = getAssignmentsForTeacher(teacherName)
  const set = new Set<string>()
  arr
    .filter(a => !klass || a.klass === klass)
    .filter(a => !section || a.section === section)
    .forEach(a => { if (a.subject) set.add(a.subject) })
  return Array.from(set)
}

// Best‑effort background prime of roster from profiles API so legacy code keeps working.
function primeRosterFromProfiles() {
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce('profiles:students')) {
      fetch('/api/mysql/profiles/students').then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const arr = j.items.map((it: any) => ({
          usn: String(it.roll || it.usn || ''),
          name: String(it.name || ''),
          klass: String(it.grade || it.klass || ''),
          section: String(it.section || ''),
        }))
        localStorage.setItem('school:students', JSON.stringify(arr))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:students' } })) } catch {}
      }).catch(()=>{})
    }
  } catch {}
}

export function rosterBy(klass: string, section: string): Student[] {
  // Make sure roster is primed from central profiles so views work
  primeRosterFromProfiles()
  const raw = localStorage.getItem('school:students')
  const all: Student[] = raw ? JSON.parse(raw) : []
  return all.filter(s => s.klass === klass && s.section === (section as any))
}

export function findStudent(usn: string): Student | undefined {
  // Ensure we’ve pulled latest roster from profiles at least once
  primeRosterFromProfiles()
  const raw = localStorage.getItem('school:students')
  const all: Student[] = raw ? JSON.parse(raw) : []
  return all.find(s => s.usn === usn)
}

export type AttendanceMark = boolean | 'P' | 'A' | 'L'

export function attendanceKey(date: string, klass: string, section: string, hour: number) {
  return `${date}|${klass}|${section}|${hour}`
}

// Optional per-slot topic, stored separately so we don't affect attendance logic.
export function readAttendanceTopic(date: string, klass: string, section: string, hour: number): string {
  try {
    const raw = localStorage.getItem('school:attendanceTopics')
    const store: Record<string, string> = raw ? JSON.parse(raw) : {}
    return store[attendanceKey(date, klass, section, hour)] || ''
  } catch {
    return ''
  }
}

export function saveAttendanceTopic(date: string, klass: string, section: string, hour: number, topic: string) {
  try {
    const key = attendanceKey(date, klass, section, hour)
    const raw = localStorage.getItem('school:attendanceTopics')
    const store: Record<string, string> = raw ? JSON.parse(raw) : {}
    const trimmed = topic.trim()
    if (trimmed) store[key] = trimmed
    else delete store[key]
    localStorage.setItem('school:attendanceTopics', JSON.stringify(store))
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:attendanceTopics' } }))
      }
    } catch {}
  } catch {}
}

export function saveAttendance(
  date: string,
  klass: string,
  section: string,
  hour: number,
  map: Record<string, AttendanceMark>,
  subject?: string,
) {
  const raw = localStorage.getItem('school:attendance')
  const store = raw ? JSON.parse(raw) : {}
  const key = attendanceKey(date, klass, section, hour)
  const payload: any = { map }
  if (subject) payload.subject = subject
  store[key] = payload
  localStorage.setItem('school:attendance', JSON.stringify(store))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:attendance' } })) } catch {}
}

export function readAttendance(date: string, klass: string, section: string, hour: number): Record<string, AttendanceMark> {
  const raw = localStorage.getItem('school:attendance')
  const store = raw ? JSON.parse(raw) : {}
  const slot = store[attendanceKey(date, klass, section, hour)]
  if (!slot) return {}
  if (slot && typeof slot === 'object' && 'map' in (slot as any)) {
    const m = (slot as any).map
    return m && typeof m === 'object' ? m : {}
  }
  return slot || {}
}

export type AttachmentLink = { type: 'link'; url: string; name?: string }
export type AttachmentFile = { type: 'file'; name: string; mime: string; dataUrl: string }
export type DiaryEntry = {
  subject: string
  teacher: string
  note: string
  klass: string
  section: string
  attachments?: Array<AttachmentLink | AttachmentFile>
  // Simple class-level assignment status for parents/students to see
  status?: 'pending' | 'submitted'
  ts?: number
}

export type AssignmentStatus = 'pending' | 'submitted'
export type AssignmentStudentRow = { usn: string; name: string; status: AssignmentStatus }
export type AssignmentEntry = {
  date: string // YYYY-MM-DD
  subject: string
  klass: string
  section: string
  deadline?: string // YYYY-MM-DD
  note?: string
  attachments?: Array<AttachmentLink | AttachmentFile>
  items: AssignmentStudentRow[]
  createdBy: string
  ts?: number
}

// ---- Academic Syllabus Stores ----
export type SyllabusSubtopic = { id: string; title: string; details?: string }
export type SyllabusChapter = { id: string; title: string; subtopics: SyllabusSubtopic[] }
export type SyllabusEntry = { klass: string; section: string; subject: string; chapters: SyllabusChapter[]; updatedAt?: number }

export function readSyllabus(klass: string, section: string, subject: string): SyllabusEntry {
  try {
    const raw = localStorage.getItem('school:syllabus')
    const arr: SyllabusEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const found = arr.find(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` === key)
    return found || { klass, section, subject, chapters: [] }
  } catch { return { klass, section, subject, chapters: [] } }
}

export function saveSyllabus(entry: SyllabusEntry) {
  try {
    const raw = localStorage.getItem('school:syllabus')
    const arr: SyllabusEntry[] = raw ? JSON.parse(raw) : []
    const key = `${entry.klass}|${entry.section}|${entry.subject.toLowerCase()}`
    const next = { ...entry, updatedAt: Date.now() }
    const filtered = arr.filter(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` !== key)
    filtered.unshift(next)
    localStorage.setItem('school:syllabus', JSON.stringify(filtered))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:syllabus' } })) } catch {}
  } catch {}
}

export type TextbookEntry = { klass: string; section: string; subject: string; name: string; mime: string; dataUrl: string; chapterId?: string | null; uploadedAt?: number }
export function setTextbook(tb: TextbookEntry) {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    // Allow multiple textbooks per subject and per chapter; prepend newest
    const next = [{ ...tb, uploadedAt: Date.now(), chapterId: tb.chapterId || null }, ...arr]
    localStorage.setItem('school:textbooks', JSON.stringify(next))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:textbooks' } })) } catch {}
  } catch {}
  // Persist subject's textbooks to DB
  try {
    if (typeof fetch !== 'undefined') {
      const raw = localStorage.getItem('school:textbooks')
      const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
      const items = arr.filter(e => e.klass === tb.klass && e.section === tb.section && e.subject.toLowerCase() === tb.subject.toLowerCase())
      fetch('/api/mysql/academics/textbooks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ klass: tb.klass, section: tb.section, subject: tb.subject, items }) })
    }
  } catch {}
}
export function getTextbook(klass: string, section: string, subject: string): TextbookEntry | null {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    // Return only the full-book entry (no chapterId)
    return arr.find(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` === key && (!e.chapterId)) || null
  } catch { return null }
}
export function getTextbookForChapter(klass: string, section: string, subject: string, chapterId: string): TextbookEntry | null {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}|${chapterId}`
    return arr.find(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}|${e.chapterId || ''}` === key) || null
  } catch { return null }
}

export function listTextbooks(klass: string, section: string, subject: string): TextbookEntry[] {
  try {
    // Prime from DB in background
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`academics:textbooks:${klass}|${section}|${subject}`)) {
      fetch(`/api/mysql/academics/textbooks?klass=${encodeURIComponent(klass)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`).then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const raw = localStorage.getItem('school:textbooks')
        const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
        // Merge replace for this subject
        const next = arr.filter(e => !(e.klass === klass && e.section === section && e.subject.toLowerCase() === subject.toLowerCase()))
        localStorage.setItem('school:textbooks', JSON.stringify([...j.items, ...next]))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:textbooks' } })) } catch {}
      }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    return arr.filter(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` === key)
  } catch { return [] }
}

export function removeTextbook(klass: string, section: string, subject: string, chapterId?: string | null, uploadedAt?: number) {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    let next: TextbookEntry[]
    if (uploadedAt) {
      // Remove only the matching entry by timestamp id
      next = arr.filter(e => !(
        e.klass === klass && e.section === section && e.subject.toLowerCase() === subject.toLowerCase() &&
        (e.chapterId || null) === (chapterId || null) && e.uploadedAt === uploadedAt
      ))
    } else {
      // Fallback: remove all entries for this subject+chapter
      const fullKey = `${klass}|${section}|${subject.toLowerCase()}|${chapterId || ''}`
      next = arr.filter(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}|${e.chapterId || ''}` !== fullKey)
    }
    localStorage.setItem('school:textbooks', JSON.stringify(next))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:textbooks' } })) } catch {}
  } catch {}
  // Persist subject's textbooks to DB after removal
  try {
    if (typeof fetch !== 'undefined') {
      const raw = localStorage.getItem('school:textbooks')
      const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
      const items = arr.filter(e => e.klass === klass && e.section === section && e.subject.toLowerCase() === subject.toLowerCase())
      fetch('/api/local/academics/textbooks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ klass, section, subject, items }) })
    }
  } catch {}
}

export type ResourceItem = AttachmentLink | AttachmentFile
export function addMaterial(klass: string, section: string, subject: string, item: ResourceItem) {
  try {
    const raw = localStorage.getItem('school:materials')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    map[key] = [item, ...arr]
    localStorage.setItem('school:materials', JSON.stringify(map))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:materials' } })) } catch {}
  } catch {}
  // Persist to DB
  try { if (typeof fetch !== 'undefined') { const item = (item as any); fetch('/api/mysql/academics/materials', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ klass, section, subject, item }) }) } } catch {}
}
export function listMaterials(klass: string, section: string, subject: string): ResourceItem[] {
  try {
    // Prime from DB in background
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`academics:materials:${klass}|${section}|${subject}`)) {
      fetch(`/api/mysql/academics/materials?klass=${encodeURIComponent(klass)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`).then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const raw = localStorage.getItem('school:materials')
        const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
        const key = `${klass}|${section}|${subject.toLowerCase()}`
        map[key] = j.items
        localStorage.setItem('school:materials', JSON.stringify(map))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:materials' } })) } catch {}
      }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:materials')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = map[key]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function removeMaterial(klass: string, section: string, subject: string, index: number) {
  try {
    const raw = localStorage.getItem('school:materials')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1)
      map[key] = arr
      localStorage.setItem('school:materials', JSON.stringify(map))
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:materials' } })) } catch {}
    }
  } catch {}
  // Persist after removal
  try { if (typeof fetch !== 'undefined') { fetch(`/api/mysql/academics/materials?klass=${encodeURIComponent(klass)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`, { method: 'DELETE' }) } } catch {}
}

export function addPyq(klass: string, section: string, subject: string, item: ResourceItem) {
  try {
    const raw = localStorage.getItem('school:pyqs')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    map[key] = [item, ...arr]
    localStorage.setItem('school:pyqs', JSON.stringify(map))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:pyqs' } })) } catch {}
  } catch {}
  // Persist to DB
  try { if (typeof fetch !== 'undefined') { const raw = localStorage.getItem('school:pyqs'); const map = raw ? JSON.parse(raw) : {}; const key = `${klass}|${section}|${subject.toLowerCase()}`; const items = map[key] || []; fetch('/api/local/academics/pyqs', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ klass, section, subject, items }) }) } } catch {}
}
export function listPyqs(klass: string, section: string, subject: string): ResourceItem[] {
  try {
    // Prime from DB in background
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`academics:pyqs:${klass}|${section}|${subject}`)) {
      fetch(`/api/local/academics/pyqs?klass=${encodeURIComponent(klass)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`).then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const raw = localStorage.getItem('school:pyqs')
        const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
        const key = `${klass}|${section}|${subject.toLowerCase()}`
        map[key] = j.items
        localStorage.setItem('school:pyqs', JSON.stringify(map))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:pyqs' } })) } catch {}
      }).catch(()=>{})
    }
    const raw = localStorage.getItem('school:pyqs')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = map[key]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function removePyq(klass: string, section: string, subject: string, index: number) {
  try {
    const raw = localStorage.getItem('school:pyqs')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1)
      map[key] = arr
      localStorage.setItem('school:pyqs', JSON.stringify(map))
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:pyqs' } })) } catch {}
    }
  } catch {}
  // Persist after removal
  try { if (typeof fetch !== 'undefined') { const raw = localStorage.getItem('school:pyqs'); const map = raw ? JSON.parse(raw) : {}; const key = `${klass}|${section}|${subject.toLowerCase()}`; const items = map[key] || []; fetch('/api/local/academics/pyqs', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ klass, section, subject, items }) }) } } catch {}
}

// ---- Circulars ----
export type Circular = {
  title: string
  body: string
  date: string // YYYY-MM-DD
  klass: string
  section: 'A' | 'B'
  attachments?: Array<AttachmentLink | AttachmentFile>
  createdBy?: string
  // Optional UI color banner; assigned on add
  color?: 'blue' | 'green' | 'orange' | 'pink' | 'violet'
  ts?: number
}

export function saveDiary(date: string, payload: DiaryEntry) {
  const raw = localStorage.getItem('school:diary')
  const store = raw ? JSON.parse(raw) : {}
  const arr: DiaryEntry[] = Array.isArray(store[date]) ? store[date] : (store[date] ? [store[date]] : [])
  const next = payload.ts ? payload : { ...payload, ts: Date.now() }
  // Replace existing entry for same subject + class/section
  const filtered = arr.filter((e: DiaryEntry) => !(
    e.subject.toLowerCase() === next.subject.toLowerCase() &&
    e.klass === next.klass &&
    e.section === next.section
  ))
  store[date] = [next, ...filtered]
  localStorage.setItem('school:diary', JSON.stringify(store))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:diary' } })) } catch {}
  // Persist to shared DB
  try { if (typeof fetch !== 'undefined') fetch('/api/mysql/teacher/diary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ date, entry: next }) }) } catch {}
}

export function readDiary(date: string): DiaryEntry[] {
  // Background prime from server (only update + dispatch if changed)
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`diary:${date}`)) fetch(`/api/mysql/teacher/diary?date=${encodeURIComponent(date)}`).then(r=>r.json()).then(j => {
      if (!j || !Array.isArray(j.items)) return
      const raw = localStorage.getItem('school:diary')
      const store = raw ? JSON.parse(raw) : {}
      const prev = store[date] || []
      const changed = JSON.stringify(prev) !== JSON.stringify(j.items)
      if (changed) {
        store[date] = j.items
        localStorage.setItem('school:diary', JSON.stringify(store))
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:diary' } })) } catch {}
      }
    }).catch(()=>{})
  } catch {}
  const raw = localStorage.getItem('school:diary')
  const store = raw ? JSON.parse(raw) : {}
  const v = store[date]
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export function readDiaryBy(date: string, klass: string, section: string): DiaryEntry[] {
  return readDiary(date).filter(e => e.klass === klass && e.section === section)
}

// ---- Assignments (per-student status) ----
const STUDENT_ASSIGNMENTS_KEY = 'school:studentAssignments'

function assignmentKey(a: AssignmentEntry) {
  return `${a.date}|${a.klass}|${a.section}|${a.subject.toLowerCase()}`
}

export function saveAssignment(entry: AssignmentEntry) {
  try {
    const raw = localStorage.getItem(STUDENT_ASSIGNMENTS_KEY)
    const arr: AssignmentEntry[] = raw ? JSON.parse(raw) : []
    const next: AssignmentEntry = { ...entry, ts: entry.ts ?? Date.now() }
    const key = assignmentKey(next)
    const filtered = arr.filter(e => assignmentKey(e) !== key)
    filtered.unshift(next)
    localStorage.setItem(STUDENT_ASSIGNMENTS_KEY, JSON.stringify(filtered))
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:studentAssignments' } }))
      }
    } catch {}
    // Best-effort sync to shared DB
    try {
      if (typeof fetch !== 'undefined') {
        fetch('/api/mysql/teacher/assignments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(next)
        }).catch(() => {})
      }
    } catch {}
  } catch {}
}

export function readAssignments(date: string, klass: string, section: string): AssignmentEntry[] {
  try {
    const all = listStudentAssignments()
    return all.filter(a => a.date === date && a.klass === klass && a.section === section)
  } catch {
    return []
  }
}

export function readAssignmentFor(date: string, klass: string, section: string, subject: string): AssignmentEntry | null {
  const list = readAssignments(date, klass, section)
  const want = subject.toLowerCase()
  for (const a of list) {
    if (a.subject.toLowerCase() === want) return a
  }
  return null
}

export function readAssignmentStatusForStudent(
  date: string,
  klass: string,
  section: string,
  subject: string,
  usn: string
): { status: AssignmentStatus; deadline?: string } | null {
  const entry = readAssignmentFor(date, klass, section, subject)
  if (!entry) return null
  const want = String(usn || '').toLowerCase()
  const row = entry.items.find(it => String(it.usn || '').toLowerCase() === want)
  if (!row) return null
  return { status: row.status, deadline: entry.deadline }
}

export function listStudentAssignments(teacherName?: string): AssignmentEntry[] {
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce('teacher:assignments:list')) {
      fetch('/api/mysql/teacher/assignments')
        .then(r => r.json())
        .then(j => {
          if (!j || !Array.isArray(j.items)) return
          const rawLocal = localStorage.getItem(STUDENT_ASSIGNMENTS_KEY)
          const arrLocal: AssignmentEntry[] = rawLocal ? JSON.parse(rawLocal) : []
          const merged = [...(j.items as AssignmentEntry[]), ...arrLocal]
          const seen = new Set<string>()
          const out: AssignmentEntry[] = []
          for (const a of merged) {
            const key = assignmentKey(a)
            if (seen.has(key)) continue
            seen.add(key)
            out.push(a)
          }
          localStorage.setItem(STUDENT_ASSIGNMENTS_KEY, JSON.stringify(out))
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('school:update', { detail: { key: 'school:studentAssignments' } })
              )
            }
          } catch {}
        })
        .catch(() => {})
    }
    const raw = localStorage.getItem(STUDENT_ASSIGNMENTS_KEY)
    const arr: AssignmentEntry[] = raw ? JSON.parse(raw) : []
    const filtered = teacherName
      ? arr.filter(a => (a.createdBy || '').toLowerCase() === teacherName.toLowerCase())
      : arr
    return filtered
      .slice()
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
  } catch {
    return []
  }
}

// ---- Academic Calendar helpers ----
export function addCalendarEvent(ev: CalendarEvent) {
  const raw = localStorage.getItem('school:calendar')
  const store = raw ? JSON.parse(raw) : {}
  const arr: CalendarEvent[] = Array.isArray(store[ev.date]) ? store[ev.date] : (store[ev.date] ? [store[ev.date]] : [])
  store[ev.date] = [ev, ...arr]
  localStorage.setItem('school:calendar', JSON.stringify(store))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:calendar' } })) } catch {}
  try { if (typeof fetch !== 'undefined') fetch('/api/mysql/teacher/calendar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ev) }) } catch {}
}

export function readCalendarByDate(date: string, klass?: string, section?: string): CalendarEvent[] {
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`cal:d:${date}${klass? '|'+klass:''}${section? '|'+section:''}`)) {
      const qp = new URLSearchParams({ date })
      if (klass) qp.set('klass', klass)
      if (section) qp.set('section', section)
      fetch(`/api/mysql/teacher/calendar?${qp.toString()}`).then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const raw = localStorage.getItem('school:calendar')
        const store = raw ? JSON.parse(raw) : {}
        const prev = store[date] || []
        const changed = JSON.stringify(prev) !== JSON.stringify(j.items)
        if (changed) {
          store[date] = j.items
          localStorage.setItem('school:calendar', JSON.stringify(store))
          try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:calendar' } })) } catch {}
        }
      }).catch(()=>{})
    }
  } catch {}
  const raw = localStorage.getItem('school:calendar')
  const store = raw ? JSON.parse(raw) : {}
  const v = store[date]
  const arr: CalendarEvent[] = v ? (Array.isArray(v) ? v : [v]) : []
  if (!klass && !section) return arr
  return arr.filter(ev => {
    if (klass && ev.klass && ev.klass !== klass) return false
    if (section && ev.section && ev.section !== section) return false
    return true
  })
}

export function readCalendarByMonth(ym: string, klass?: string, section?: string): CalendarEvent[] {
  // ym: YYYY-MM
  try {
    if (typeof fetch !== 'undefined' && shouldFetchOnce(`cal:m:${ym}${klass? '|'+klass:''}${section? '|'+section:''}`)) {
      const qp = new URLSearchParams({ ym })
      if (klass) qp.set('klass', klass)
      if (section) qp.set('section', section)
      fetch(`/api/mysql/teacher/calendar?${qp.toString()}`).then(r=>r.json()).then(j => {
        if (!j || !Array.isArray(j.items)) return
        const raw = localStorage.getItem('school:calendar')
        const store = raw ? JSON.parse(raw) : {}
        // Build a candidate next store
        const next = { ...store }
        for (const ev of j.items) {
          const d = ev.date
          const arr: CalendarEvent[] = Array.isArray(next[d]) ? next[d] : (next[d] ? [next[d]] : [])
          // Prepend only if not already present
          const exists = arr.find((e:any) => JSON.stringify(e) === JSON.stringify(ev))
          next[d] = exists ? arr : [ev, ...arr]
        }
        const changed = JSON.stringify(next) !== JSON.stringify(store)
        if (changed) {
          localStorage.setItem('school:calendar', JSON.stringify(next))
          try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:calendar' } })) } catch {}
        }
      }).catch(()=>{})
    }
  } catch {}
  const raw = localStorage.getItem('school:calendar')
  const store = raw ? JSON.parse(raw) : {}
  const out: CalendarEvent[] = []
  for (const k of Object.keys(store)) {
    if (k.slice(0,7) === ym) {
      const v = store[k]
      const arr: CalendarEvent[] = Array.isArray(v) ? v : [v]
      for (const ev of arr) {
        // If klass/section filters are provided, only include matching or global events
        if (klass && ev.klass && ev.klass !== klass) continue
        if (section && ev.section && ev.section !== section) continue
        out.push(ev)
      }
    }
  }
  return out
}

// ---- Marks & Assessments ----
export type MarkSheet = {
  test: string // e.g., UT-1, MID SEM, etc.
  subject: string
  klass: string
  section: string
  date?: string // YYYY-MM-DD
  max: number
  marks: Record<string, number> // usn -> score
  createdBy?: string
  ts?: number
}

function ensureMarksStore() {
  if (!localStorage.getItem('school:marks')) {
    localStorage.setItem('school:marks', JSON.stringify([]))
  }
}

function primeMarksFromServer() {
  try {
    if (typeof fetch === 'undefined') return
    const now = Date.now()
    const last = Number(localStorage.getItem('school:marks:last') || '0')
    if (now - last < 3000) return
    localStorage.setItem('school:marks:last', String(now))
    fetch('/api/mysql/teacher/marks').then(r => r.json()).then(j => {
      if (!j || !Array.isArray(j.items)) return
      localStorage.setItem('school:marks', JSON.stringify(j.items))
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:marks' } })) } catch {}
    }).catch(()=>{})
  } catch {}
}

export function saveMarks(sheet: MarkSheet) {
  ensureMarksStore()
  const raw = localStorage.getItem('school:marks')!
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const key = (x: MarkSheet) => `${x.test.toLowerCase()}|${x.subject.toLowerCase()}|${x.klass}|${x.section}`
  const k = key(sheet)
  const next: MarkSheet = { ...sheet, ts: Date.now() }
  const filtered = arr.filter(m => key(m) !== k)
  filtered.unshift(next)
  localStorage.setItem('school:marks', JSON.stringify(filtered))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:marks' } })) } catch {}
  // Persist to shared DB in background
  try { if (typeof fetch !== 'undefined') fetch('/api/mysql/teacher/marks/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) }) } catch {}
}

export function readMarks(klass: string, section: string, subject: string, test: string): MarkSheet | null {
  primeMarksFromServer()
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const nk = (x:string) => (String(x||'').toLowerCase().replace(/\s+/g,' ').trim())
  const ns = (x:string) => (String(x||'').toUpperCase().trim())
  const wantK = nk(klass)
  const wantS = ns(section as any)
  const wantSub = String(subject||'').toLowerCase()
  const wantTest = String(test||'').toLowerCase()
  const found = arr.find(m => nk(m.klass) === wantK && ns(m.section as any) === wantS && String(m.subject||'').toLowerCase() === wantSub && String(m.test||'').toLowerCase() === wantTest)
  return found || null
}

export function readMarksByStudent(usn: string): Array<{ test: string; subject: string; score: number; max: number; date?: string; klass: string; section: string; ts?: number }> {
  primeMarksFromServer()
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const out: Array<{ test: string; subject: string; score: number; max: number; date?: string; klass: string; section: string; ts?: number }> = []
  for (const m of arr) {
    if (usn in m.marks) {
      out.push({ test: m.test, subject: m.subject, score: Number(m.marks[usn] ?? 0), max: m.max, date: m.date, klass: m.klass, section: m.section, ts: m.ts })
    }
  }
  // newest first
  out.sort((a,b) => (b.ts || 0) - (a.ts || 0))
  return out
}

export function listTestsBySubject(klass: string, section: string, subject: string): string[] {
  primeMarksFromServer()
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const nk = (x:string) => (String(x||'').toLowerCase().replace(/\s+/g,' ').trim())
  const ns = (x:string) => (String(x||'').toUpperCase().trim())
  const wantK = nk(klass)
  const wantS = ns(section as any)
  const wantSub = String(subject||'').toLowerCase()
  const set = new Set<string>()
  for (const m of arr) {
    if (nk(m.klass) === wantK && ns(m.section as any) === wantS && String(m.subject||'').toLowerCase() === wantSub) {
      set.add(m.test)
    }
  }
  return Array.from(set)
}

function normalizeTestName(name: string) {
  return (name || '').toLowerCase().trim()
}

export function readTotalsByTest(klass: string, section: string, test: string): Array<{ usn: string; sum: number; total: number; pct: number }> {
  primeMarksFromServer()
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const want = normalizeTestName(test)
  const nk = (x:string) => (String(x||'').toLowerCase().replace(/\s+/g,' ').trim())
  const ns = (x:string) => (String(x||'').toUpperCase().trim())
  const wantK = nk(klass)
  const wantS = ns(section as any)
  const sums: Record<string, { sum: number; total: number }> = {}
  for (const m of arr) {
    if (nk(m.klass) !== wantK || ns(m.section as any) !== wantS) continue
    if (normalizeTestName(m.test) !== want) continue
    for (const usn of Object.keys(m.marks || {})) {
      const v = Number((m.marks as any)[usn] ?? 0)
      if (!sums[usn]) sums[usn] = { sum: 0, total: 0 }
      sums[usn].sum += isNaN(v) ? 0 : v
      sums[usn].total += m.max || 0
    }
  }
  const out: Array<{ usn: string; sum: number; total: number; pct: number }> = []
  for (const usn of Object.keys(sums)) {
    const { sum, total } = sums[usn]
    const pct = total ? (sum * 100) / total : 0
    out.push({ usn, sum, total, pct: Math.round(pct) })
  }
  // Sort by percentage desc, then by sum desc to break ties consistently
  out.sort((a,b) => (b.pct - a.pct) || (b.sum - a.sum))
  return out
}

export function readTestRank(klass: string, section: string, test: string, usn: string): { rank: number | null; of: number; sum: number; total: number; pct: number } {
  const totals = readTotalsByTest(klass, section, test)
  const of = totals.length
  const idx = totals.findIndex(t => t.usn === usn)
  if (idx === -1) return { rank: null, of, sum: 0, total: 0, pct: 0 }
  // Compute dense rank (equal scores share same rank)
  let rank = 1
  for (let i = 0; i < idx; i++) {
    if (totals[i].pct > totals[idx].pct || (totals[i].pct === totals[idx].pct && totals[i].sum > totals[idx].sum)) {
      rank += 1
    }
  }
  const me = totals[idx]
  return { rank, of, sum: me.sum, total: me.total, pct: me.pct }
}

// ---- Aggregates & helpers for dashboards ----
export function listTestsForClass(klass: string, section: string): string[] {
  primeMarksFromServer()
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const nk = (x:string) => (String(x||'').toLowerCase().replace(/\s+/g,' ').trim())
  const ns = (x:string) => (String(x||'').toUpperCase().trim())
  const wantK = nk(klass)
  const wantS = ns(section as any)
  const seen = new Map<string, number>() // test -> latest ts
  for (const m of arr) {
    if (nk(m.klass) !== wantK || ns(m.section as any) !== wantS) continue
    const t = m.test
    const ts = m.ts || 0
    if (!seen.has(t) || (seen.get(t)! < ts)) seen.set(t, ts)
  }
  return Array.from(seen.entries()).sort((a,b) => b[1] - a[1]).map(([t]) => t)
}

export function subjectAveragesForTest(klass: string, section: string, test: string): Array<{ subject: string; pct: number }> {
  primeMarksFromServer()
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const nk = (x:string) => (String(x||'').toLowerCase().replace(/\s+/g,' ').trim())
  const ns = (x:string) => (String(x||'').toUpperCase().trim())
  const wantK = nk(klass)
  const wantS = ns(section as any)
  const wantT = normalizeTestName(test)
  const acc = new Map<string, { sum: number; total: number }>()
  for (const m of arr) {
    if (nk(m.klass) !== wantK || ns(m.section as any) !== wantS) continue
    if (normalizeTestName(m.test) !== wantT) continue
    const subject = String(m.subject || '')
    let sum = 0, total = 0
    for (const usn of Object.keys(m.marks || {})) {
      const v = Number((m.marks as any)[usn] ?? 0)
      sum += isNaN(v) ? 0 : v
      total += m.max || 0
    }
    const prev = acc.get(subject) || { sum: 0, total: 0 }
    acc.set(subject, { sum: prev.sum + sum, total: prev.total + total })
  }
  return Array.from(acc.entries()).map(([subject, { sum, total }]) => ({ subject, pct: total ? Math.round((sum * 100) / total) : 0 }))
}

export function getMarkSheet(klass: string, section: string, subject: string, test: string): MarkSheet | null {
  return readMarks(klass, section, subject, test)
}

export function studentAttendanceSummaryBefore(usn: string, klass: string, section: string, uptoDate: string, subject?: string): { attended: number; total: number } {
  const raw = localStorage.getItem('school:attendance')
  const store: Record<string, Record<string, AttendanceMark>> = raw ? JSON.parse(raw) : {}
  const out = { attended: 0, total: 0 }
  if (!store || typeof store !== 'object') return out
  const wantSub = typeof subject === 'string' && subject.trim() ? subject.toLowerCase() : ''
  for (const key of Object.keys(store)) {
    const parts = key.split('|')
    if (parts.length < 4) continue
    const [date, k, s, hourStr] = parts
    if (k !== klass || s !== section) continue
    if (date > uptoDate) continue
    if (wantSub) {
      const hour = Number(hourStr)
      const actualSub = subjectForHourFor(klass, section, hour)
      if (String(actualSub || '').toLowerCase() !== wantSub) continue
    }
    const map = store[key] || {}
    if (Object.prototype.hasOwnProperty.call(map, usn)) {
      out.total += 1
      const v = map[usn] as AttendanceMark
      if (v === true || v === 'P') out.attended += 1
    }
  }
  return out
}

export function studentAttendanceSummaryBetween(usn: string, klass: string, section: string, fromDateExclusive: string, toDateInclusive: string, subject?: string): { attended: number; total: number } {
  const raw = localStorage.getItem('school:attendance')
  const store: Record<string, Record<string, AttendanceMark>> = raw ? JSON.parse(raw) : {}
  const out = { attended: 0, total: 0 }
  if (!store || typeof store !== 'object') return out
  const wantSub = typeof subject === 'string' && subject.trim() ? subject.toLowerCase() : ''
  for (const key of Object.keys(store)) {
    const parts = key.split('|')
    if (parts.length < 4) continue
    const [date, k, s, hourStr] = parts
    if (k !== klass || s !== section) continue
    if (!(date > fromDateExclusive && date <= toDateInclusive)) continue
    if (wantSub) {
      const hour = Number(hourStr)
      const actualSub = subjectForHourFor(klass, section, hour)
      if (String(actualSub || '').toLowerCase() !== wantSub) continue
    }
    const map = store[key] || {}
    if (Object.prototype.hasOwnProperty.call(map, usn)) {
      out.total += 1
      const v = map[usn] as AttendanceMark
      if (v === true || v === 'P') out.attended += 1
    }
  }
  return out
}

// ---- Class attendance aggregates (percent) ----
export function classAttendanceAverageBefore(klass: string, section: string, uptoDate: string, subject?: string): number {
  try {
    const roster = rosterBy(klass, section)
    if (!roster || roster.length === 0) return 0
    let attended = 0, total = 0
    for (const s of roster) {
      const a = studentAttendanceSummaryBefore(s.usn, klass, section, uptoDate, subject)
      attended += a.attended
      total += a.total
    }
    return total ? Math.round((attended * 100) / total) : 0
  } catch { return 0 }
}

export function classAttendanceAverageBetween(klass: string, section: string, fromDateExclusive: string, toDateInclusive: string, subject?: string): number {
  try {
    const roster = rosterBy(klass, section)
    if (!roster || roster.length === 0) return 0
    let attended = 0, total = 0
    for (const s of roster) {
      const a = studentAttendanceSummaryBetween(s.usn, klass, section, fromDateExclusive, toDateInclusive, subject)
      attended += a.attended
      total += a.total
    }
    return total ? Math.round((attended * 100) / total) : 0
  } catch { return 0 }
}

// ---- Circular helpers ----
export function addCircular(c: Circular) {
  const raw = localStorage.getItem('school:circulars')
  const arr: Circular[] = raw ? JSON.parse(raw) : []
  // Assign a rotating banner color so each new circular has a new color
  const palette = ['blue','green','orange','pink','violet'] as const
  let idx = 0
  try {
    const stored = localStorage.getItem('school:circulars:nextColorIndex')
    const n = stored ? parseInt(stored, 10) : 0
    if (!Number.isNaN(n) && n >= 0 && n < palette.length) idx = n
  } catch {}
  const assignedColor = c.color && (palette as readonly string[]).includes(c.color) ? c.color : (palette[idx] as (typeof palette)[number])
  const nextIdx = (idx + 1) % palette.length
  try { localStorage.setItem('school:circulars:nextColorIndex', String(nextIdx)) } catch {}

  const next: Circular = { ...c, color: assignedColor, ts: c.ts ?? Date.now() }
  arr.unshift(next)
  localStorage.setItem('school:circulars', JSON.stringify(arr))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:circulars' } })) } catch {}
  try { if (typeof fetch !== 'undefined') fetch('/api/mysql/teacher/circulars', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) }) } catch {}
}

export function readCircularsByClassSection(klass: string, section: 'A' | 'B'): Circular[] {
  try { if (typeof fetch !== 'undefined' && shouldFetchOnce(`circ:${klass}|${section}`)) fetch(`/api/mysql/teacher/circulars?klass=${encodeURIComponent(klass)}&section=${encodeURIComponent(section)}`).then(r=>r.json()).then(j => {
    if (!j || !Array.isArray(j.items)) return
    const raw = localStorage.getItem('school:circulars')
    const arr: Circular[] = raw ? JSON.parse(raw) : []
    const list = [...j.items, ...arr]
    // De‑duplicate by stable key (prefer server items first)
    const seen = new Set<string>()
    const uniq: Circular[] = []
    for (const c of list) {
      const key = `${c.klass}|${c.section}|${c.ts ? String(c.ts) : `${(c.title||'').toLowerCase()}|${c.date||''}`}`
      if (seen.has(key)) continue
      seen.add(key)
      uniq.push(c)
    }
    const changed = JSON.stringify(uniq) !== JSON.stringify(arr)
    if (changed) {
      localStorage.setItem('school:circulars', JSON.stringify(uniq))
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:circulars' } })) } catch {}
    }
  }).catch(()=>{}) } catch {}
  const raw = localStorage.getItem('school:circulars')
  const arr: Circular[] = raw ? JSON.parse(raw) : []
  // Local de‑duplication as a safety net
  const seen = new Set<string>()
  const uniqLocal: Circular[] = []
  for (const c of arr) {
    const key = `${c.klass}|${c.section}|${c.ts ? String(c.ts) : `${(c.title||'').toLowerCase()}|${c.date||''}`}`
    if (seen.has(key)) continue
    seen.add(key)
    uniqLocal.push(c)
  }
  if (uniqLocal.length !== arr.length) {
    try { localStorage.setItem('school:circulars', JSON.stringify(uniqLocal)) } catch {}
  }
  return uniqLocal.filter(c => c.klass === klass && c.section === section)
}
