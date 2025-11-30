"use client"
import React from 'react'
import { findStudent, readCircularsByClassSection, readDiaryBy, readAssignments, readAssignmentStatusForStudent } from '../../teacher/data'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { MotionDiv, MotionSection } from '../../../components/MotionComponents'

type EventColor = 'blue' | 'green' | 'orange'

type Event = { date: string; title: string; color: EventColor; description: string; tag: string }

type CircularFilter = 'today' | 'week' | 'month'

// No static diary entries; shows only what teachers publish

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)
  const storageKeyRef = React.useRef<string>('theme')
  React.useEffect(() => {
    setMounted(true)
    try {
      // Derive per-student theme key if available
      const sraw = sessionStorage.getItem('student')
      if (sraw) {
        try {
          const { roll } = JSON.parse(sraw)
          if (roll) storageKeyRef.current = `student:theme:${roll}`
        } catch { }
      }
      const stored = localStorage.getItem(storageKeyRef.current) as 'light' | 'dark' | null
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark')
      }
    } catch { }
  }, [])
  React.useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(storageKeyRef.current, theme) } catch { }
  }, [theme, mounted])
  return { theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) }
}

function getMonthMatrix(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // start on Monday
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function formatYMD(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Deterministic date helpers to avoid SSR/CSR locale differences
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

function ymOf(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}

function formatDMYFromYMD(ymd: string) {
  // ymd is expected as YYYY-MM-DD
  const y = ymd.slice(0, 4)
  const m = ymd.slice(5, 7)
  const d = ymd.slice(8, 10)
  return `${d}/${m}/${y}`
}

function parseAttendanceStore() {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem('school:attendance')
  return raw ? JSON.parse(raw) : {}
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
}

const cardVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
}

export default function StudentDashboard() {
  const pathname = usePathname()
  const { toggle, theme } = useTheme()

  const [month, setMonth] = React.useState(() => new Date())
  const [name, setName] = React.useState('Student')
  const [roll, setRoll] = React.useState('')
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [selectedDay, setSelectedDay] = React.useState<string | null>(() => new Date().toISOString().slice(0, 10))
  const [diaryDate, setDiaryDate] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('student:lastDiaryDate')
        if (stored) return stored
      } catch { }
    }
    return new Date().toISOString().slice(0, 10)
  })
  const [profileDraftName, setProfileDraftName] = React.useState('Student')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const [idCardOpen, setIdCardOpen] = React.useState(false)
  const [idCardFlipped, setIdCardFlipped] = React.useState(false)
  const [idDetails, setIdDetails] = React.useState<{
    admissionNumber: string
    dob: string
    bloodGroup: string
    fatherName: string
    fatherPhone: string
    motherName: string
    motherPhone: string
    address: string
  } | null>(null)
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const mobileNavRef = React.useRef<HTMLDivElement | null>(null)

  // Mobile breakpoint detection to alter calendar behavior
  const isMobile = (() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 640px)').matches
  })()

  React.useEffect(() => {
    const stored = sessionStorage.getItem('student')
    if (stored) {
      try {
        const obj = JSON.parse(stored)
        if (obj.name) {
          setName(obj.name)
          setProfileDraftName(obj.name)
        }
        if (obj.roll) {
          setRoll(obj.roll)
          try {
            const ph = localStorage.getItem(`student:photo:${obj.roll}`)
            if (ph) setPhoto(ph)
          } catch { }
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  React.useEffect(() => {
    setProfileDraftName(name)
  }, [name])

  const studentInfo = React.useMemo(() => {
    if (!roll) return null
    try {
      return findStudent(String(roll))
    } catch {
      return null
    }
  }, [roll])

  // Load extra ID card details from admissions DB when the card is opened
  React.useEffect(() => {
    if (!idCardOpen) return
    if (!roll) return
    if (idDetails) return
      ; (async () => {
        try {
          const res = await fetch(
            `/api/local/student/idcard?roll=${encodeURIComponent(roll)}`,
          )
          const j = await res.json()
          if (j && j.ok && j.details) {
            setIdDetails(j.details)
          }
        } catch {
          // ignore failures; card will just show blanks
        }
      })()
  }, [idCardOpen, roll, idDetails])

  const days = getMonthMatrix(month)
  const isSameMonth = (d: Date) => d.getMonth() === month.getMonth()
  const isToday = (d: Date) => {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }
  const monthStr = `${MONTHS[month.getMonth()]} ${month.getFullYear()}`
  const [extraEvents, setExtraEvents] = React.useState<Event[]>([])
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('school:calendar')
      if (!raw) { setExtraEvents([]); return }
      const store = JSON.parse(raw)
      const out: Event[] = []
      for (const k of Object.keys(store)) {
        const v = store[k]
        const arr = Array.isArray(v) ? v : [v]
        for (const ev of arr) {
          out.push({ date: ev.date, title: ev.title, color: ev.color as EventColor, description: ev.description, tag: ev.tag })
        }
      }
      setExtraEvents(out)
    } catch { setExtraEvents([]) }
  }, [])
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:calendar') {
        try {
          const raw = localStorage.getItem('school:calendar')
          const store = raw ? JSON.parse(raw) : {}
          const out: Event[] = []
          for (const k of Object.keys(store)) {
            const v = store[k]; const arr = Array.isArray(v) ? v : [v]
            for (const ev of arr) out.push({ date: ev.date, title: ev.title, color: ev.color as EventColor, description: ev.description, tag: ev.tag })
          }
          setExtraEvents(out)
        } catch { setExtraEvents([]) }
      }
    }
    const onBus = () => {
      try {
        const raw = localStorage.getItem('school:calendar')
        const store = raw ? JSON.parse(raw) : {}
        const out: Event[] = []
        for (const k of Object.keys(store)) {
          const v = store[k]; const arr = Array.isArray(v) ? v : [v]
          for (const ev of arr) out.push({ date: ev.date, title: ev.title, color: ev.color as EventColor, description: ev.description, tag: ev.tag })
        }
        setExtraEvents(out)
      } catch { setExtraEvents([]) }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [])
  const allEvents = React.useMemo(() => [...extraEvents], [extraEvents])
  const eventsThisMonth = allEvents.filter(e => e.date.slice(0, 7) === ymOf(month))
  const [eventPopupDate, setEventPopupDate] = React.useState<string | null>(null)
  const [eventPopupItems, setEventPopupItems] = React.useState<Event[]>([])

  // Circulars pulled from teacher circulars store (per class/section)
  const [circulars, setCirculars] = React.useState<
    Array<{ title: string; date: string; tag: string }>
  >([])

  const recomputeCirculars = React.useCallback(() => {
    try {
      const raw = sessionStorage.getItem('student')
      if (!raw) {
        setCirculars([])
        return
      }
      const { roll } = JSON.parse(raw)
      const me = findStudent(String(roll || ''))
      if (!me) {
        setCirculars([])
        return
      }
      const list = readCircularsByClassSection(me.klass, me.section as 'A' | 'B')
      const mapped = list
        .map(c => ({
          title: c.title || 'Circular',
          date: c.date || '',
          tag: c.tag || 'CIRCULAR',
        }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setCirculars(mapped)
    } catch {
      setCirculars([])
    }
  }, [])

  React.useEffect(() => {
    recomputeCirculars()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:circulars') recomputeCirculars()
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key || key === 'school:circulars') recomputeCirculars()
      } catch {
        recomputeCirculars()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [recomputeCirculars])

  const CIRCULAR_CARD_COLORS = ['blue', 'green', 'orange', 'pink'] as const
  const [circularFilter, setCircularFilter] = React.useState<CircularFilter[]>(['month'])
  const [showCircularFilter, setShowCircularFilter] = React.useState(false)
  const circularsFiltered = React.useMemo(() => {
    if (!circulars.length) return []
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const monthKey = ymOf(month)
    const parse = (d: string) => {
      const [y, m, day] = d.split('-').map(Number)
      return new Date(y, (m || 1) - 1, day || 1)
    }
    const active = Array.isArray(circularFilter) ? circularFilter : circularFilter ? [circularFilter] : []

    return circulars.filter(c => {
      if (!c.date) return false
      const dateStr = c.date.slice(0, 10)
      const d = parse(dateStr)
      if (Number.isNaN(d.getTime())) return false
      if (!active.length) {
        // default: current month
        return c.date.slice(0, 7) === monthKey
      }
      let ok = false
      if (active.includes('today') && dateStr === todayStr) ok = true
      if (active.includes('week')) {
        const diffMs = d.getTime() - new Date(todayStr).getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays >= -3 && diffDays <= 3 && c.date.slice(0, 7) === monthKey) ok = true
      }
      if (active.includes('month') && c.date.slice(0, 7) === monthKey) ok = true
      return ok
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [circulars, circularFilter, month])

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result)
      setPhotoDraft(data)
    }
    reader.readAsDataURL(file)
  }

  const previewPhoto = photoDraft ?? photo
  const [diaryEntries, setDiaryEntries] = React.useState<
    Array<{ subject: string; teacher: string; note: string; attachments?: any[]; color: EventColor; status: 'pending' | 'submitted'; deadline?: string }>
  >([])

  // Keep dashboard "Homework / Assignments" in sync with Digital Diary page
  React.useEffect(() => {
    const recompute = () => {
      try {
        let klass: string | null = null
        let section: string | null = null
        let usn: string | null = null
        try {
          const sraw = sessionStorage.getItem('student')
          if (sraw) {
            const { roll } = JSON.parse(sraw)
            const me = findStudent(String(roll || ''))
            if (me) {
              klass = me.klass
              section = me.section
              usn = me.usn
            }
          }
        } catch { }
        if (!klass || !section) {
          setDiaryEntries([])
          return
        }

        let arr: any[] = readDiaryBy(diaryDate, klass, section)

        if (!arr || !arr.length) {
          try {
            const backup = readAssignments(diaryDate, klass, section)
            if (backup && backup.length) {
              arr = backup.map(a => ({
                subject: a.subject || 'Subject',
                teacher: a.createdBy || 'Teacher',
                note: a.note || '',
                status: 'pending',
                attachments: a.attachments || []
              }))
            }
          } catch { }
        }

        const mapped = (arr || []).map((e: any, idx: number) => {
          let status: 'pending' | 'submitted' = e.status === 'submitted' ? 'submitted' : 'pending'
          let deadline: string | undefined = e.deadline
          try {
            if (klass && section && usn && e.subject) {
              const s = readAssignmentStatusForStudent(diaryDate, klass, section, e.subject, usn)
              if (s?.status) status = s.status
              if (s?.deadline) deadline = s.deadline
            }
          } catch { }
          return {
            subject: e.subject || 'Subject',
            teacher: e.teacher || e.createdBy || 'Teacher',
            note: e.note || '',
            attachments: e.attachments || [],
            color: (['blue', 'green', 'orange'] as EventColor[])[idx % 3],
            status,
            deadline
          }
        })
        setDiaryEntries(mapped)
      } catch {
        setDiaryEntries([])
      }
    }

    recompute()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:diary' || e.key === 'school:studentAssignments') recompute()
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key || key === 'school:diary' || key === 'school:studentAssignments') recompute()
      } catch {
        recompute()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [diaryDate])

  // Compute real attendance percentage across all recorded periods for this student.
  React.useEffect(() => {
    try {
      const sraw = sessionStorage.getItem('student')
      if (!sraw) return
      const { roll } = JSON.parse(sraw)
      const me = findStudent(String(roll || ''))
      if (!me) return
      const store = parseAttendanceStore() as Record<string, Record<string, any>>
      let total = 0
      let present = 0
      for (const key of Object.keys(store)) {
        const parts = key.split('|')
        if (parts.length < 4) continue
        const [, klass, section] = parts
        if (klass !== me.klass || section !== me.section) continue
        const marks = store[key] || {}
        if (!(me.usn in marks)) continue
        const raw = marks[me.usn]
        total += 1
        if (raw === true || raw === 'P') present += 1
      }
      if (!total) {
        setAttendanceSummary(null)
        return
      }
      const pct = Math.round((present * 100) / total)
      setAttendanceSummary({ present: pct })
    } catch {
      setAttendanceSummary(null)
    }
  }, [])

  const [attendanceSummary, setAttendanceSummary] = React.useState<{ present: number } | null>(null)

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/progress', label: 'Progress', icon: '📊' },
    { href: '/student/attendance', label: 'Attendance', icon: '✅' },
    { href: '/student/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/student/calendar', label: 'Calendar', icon: '📅' },
    { href: '/student/circulars', label: 'Circulars', icon: '📣' },
    { href: '/student/syllabus', label: 'Academic Syllabus', icon: '📘' }
  ]

  const closeMenu = React.useCallback(() => {
    setMenuOpen(false)
    setPhotoDraft(null)
    setProfileDraftPassword('')
    setProfileMessage('')
    setProfileDraftName(name)
    // keep name in sync
  }, [name])

  const onAvatarClick = () => {
    setMenuOpen(open => {
      const next = !open
      if (next) {
        setProfileDraftName(name)
        setProfileDraftPassword('')
        setProfileMessage('')
        setPhotoDraft(null)
      } else {
        setPhotoDraft(null)
        setProfileDraftPassword('')
        setProfileMessage('')
      }
      return next
    })
  }

  const greeting = React.useMemo(() => {
    const now = new Date()
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Close the profile menu when the user clicks outside or presses Escape.
  React.useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (avatarRef.current?.contains(target)) return
      closeMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen, closeMenu])

  // Close the mobile nav on outside click or Escape
  React.useEffect(() => {
    if (!mobileNavOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (mobileNavRef.current?.contains(target)) return
      setMobileNavOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileNavOpen])

  const handleProfileSave = () => {
    try {
      const stored = sessionStorage.getItem('student')
      const payload = stored ? JSON.parse(stored) : {}
      const trimmedName = profileDraftName.trim() || 'Student'
      payload.name = trimmedName
      if (roll) payload.roll = roll
      if (profileDraftPassword.trim()) {
        payload.password = profileDraftPassword.trim()
      }
      sessionStorage.setItem('student', JSON.stringify(payload))
      // Persist per-student profile
      try {
        localStorage.setItem(
          `student:profile:${roll}`,
          JSON.stringify({
            name: trimmedName,
            password: payload.password || ''
          })
        )
      } catch { }
      setName(trimmedName)
      if (photoDraft) {
        try { localStorage.setItem(`student:photo:${roll}`, photoDraft) } catch { }
        setPhoto(photoDraft)
        setPhotoDraft(null)
      }
      setProfileDraftPassword('')
      setProfileMessage('Profile updated successfully.')
    } catch {
      setProfileMessage('Could not update profile. Please try again.')
    }
  }

  return (
    <MotionDiv
      className="student-shell"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="topbar topbar-student">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>STUDENT</strong>
          </div>
          <nav className="tabs" aria-label="Student navigation">
            {navLinks
              .filter(link =>
                link.href !== '/student/dashboard' &&
                link.href !== '/student/calendar' &&
                link.href !== '/student/circulars'
              )
              .map(link => {
                const active = pathname?.startsWith(link.href)
                return (
                  <Link key={link.href} className={`tab ${active ? 'tab-active' : ''}`} href={link.href}>
                    {link.label}
                  </Link>
                )
              })}
          </nav>
          <div className="actions" style={{ position: 'relative' }}>
            <button
              className="btn-ghost hamburger"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(open => !open)}
            >
              ☰
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button className="btn-ghost" onClick={toggle} aria-label="Toggle theme">
                  {theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
                <button
                  className="btn-ghost"
                  type="button"
                  aria-label="View ID card"
                  title="View ID card"
                  onClick={() => {
                    setIdCardFlipped(false)
                    setIdCardOpen(true)
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 18,
                        borderRadius: 4,
                        border: '1.5px solid currentColor',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '2px 3px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          border: '1px solid currentColor'
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          marginLeft: 3,
                          height: 8,
                          borderTop: '1px solid currentColor',
                          borderBottom: '1px solid currentColor',
                          opacity: 0.85
                        }}
                      />
                    </span>
                  </span>
                </button>
              </div>
              {previewPhoto ? (
                <img
                  ref={avatarRef as React.MutableRefObject<HTMLImageElement | null>}
                  src={previewPhoto}
                  alt="Profile"
                  className="avatar"
                  onClick={onAvatarClick}
                />
              ) : (
                <div
                  ref={avatarRef}
                  className="avatar"
                  aria-label="Set profile photo"
                  title="Set profile photo"
                  onClick={onAvatarClick}
                />
              )}
            </div>
            {menuOpen && (
              <div
                ref={menuRef}
                className="menu"
                role="dialog"
                aria-label="Profile settings"
                style={{ maxHeight: '80vh', overflowY: 'auto' }}
              >
                <div className="menu-title">Profile Settings</div>
                <div className="field">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={profileDraftName}
                    onChange={event => setProfileDraftName(event.target.value)}
                    placeholder="Student name"
                  />
                </div>
                <div className="field">
                  <label className="label">Roll Number</label>
                  <input className="input" value={roll || 'Not allocated yet'} readOnly />
                </div>
                <div className="field">
                  <label className="label">Reset Password (simple)</label>
                  <input
                    className="input"
                    type="password"
                    value={profileDraftPassword}
                    placeholder="Enter new simple password"
                    onChange={event => setProfileDraftPassword(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Profile Photo</label>
                  <input className="input" type="file" accept="image/*" onChange={event => onPhotoChange(event.target.files?.[0])} />
                  {photoDraft && <div className="profile-preview">Preview ready. Save to keep changes.</div>}
                </div>
                {profileMessage && <div className="profile-message">{profileMessage}</div>}
                <div className="actions">
                  <button className="btn" type="button" onClick={handleProfileSave}>
                    Save changes
                  </button>
                  <button className="btn-ghost" type="button" onClick={closeMenu}>
                    Close
                  </button>
                </div>
              </div>
            )}
            {mobileNavOpen && (
              <div ref={mobileNavRef} className="mobile-nav" role="dialog" aria-label="Mobile navigation">
                {navLinks.map(link => {
                  const active = pathname?.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      className={`tab ${active ? 'tab-active' : ''}`}
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {idCardOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 16,
          }}
        >
          <div>
            <div id="student-id-card" className="id-card-shell">
              <div
                className={`id-card ${idCardFlipped ? 'id-card-flipped' : ''}`}
                onClick={() => setIdCardFlipped(f => !f)}
                aria-label="Student ID card – tap to flip"
              >
                {/* Front */}
                <div className="id-card-face id-card-front">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div className="id-card-title">Student Identity Card</div>
                      <div className="id-card-school">Gopalan International School</div>
                    </div>
                    <div className="id-card-photo">
                      {previewPhoto ? (
                        <img src={previewPhoto} alt="Student" />
                      ) : (
                        <span>{(name || 'S').slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.1fr',
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <div>
                      <div className="id-card-field-label">Name</div>
                      <div className="id-card-field-value">{name}</div>
                    </div>
                    <div>
                      <div className="id-card-field-label">Roll No.</div>
                      <div className="id-card-field-value">
                        {roll || 'Not allocated yet'}
                      </div>
                    </div>
                    <div>
                      <div className="id-card-field-label">Class & Section</div>
                      <div className="id-card-field-value">
                        {studentInfo?.klass || '—'} {studentInfo?.section || ''}
                      </div>
                    </div>
                    <div>
                      <div className="id-card-field-label">Academic Year</div>
                      <div className="id-card-field-value">
                        {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                      </div>
                    </div>
                    <div>
                      <div className="id-card-field-label">Admission No.</div>
                      <div className="id-card-field-value">
                        {idDetails?.admissionNumber || '—'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }} className="id-card-meta">
                    Tap to view guardian and address details on the back side.
                  </div>
                </div>

                {/* Back */}
                <div className="id-card-face id-card-back">
                  <div className="id-card-title">Authorised Identity</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    <strong>{name}</strong> •{' '}
                    {studentInfo?.klass || 'Class'} {studentInfo?.section || ''}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.5 }}>
                    <div>
                      <span className="id-card-field-label">School</span>
                      <div className="id-card-field-value">
                        Gopalan International School
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span className="id-card-field-label">Address</span>
                      <div>{idDetails?.address || '—'}</div>
                    </div>
                    <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <span className="id-card-field-label">Father</span>
                        <div className="id-card-field-value">
                          {idDetails?.fatherName || '—'}
                        </div>
                        <div className="id-card-meta">
                          {idDetails?.fatherPhone || ''}
                        </div>
                      </div>
                      <div>
                        <span className="id-card-field-label">Mother</span>
                        <div className="id-card-field-value">
                          {idDetails?.motherName || '—'}
                        </div>
                        <div className="id-card-meta">
                          {idDetails?.motherPhone || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }} className="id-card-footer" />
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                className="btn-tiny"
                onClick={() => setIdCardOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dash-wrap student-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-student" aria-label="Student quick navigation">
            {navLinks.map(link => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`side-nav-link ${active ? 'side-nav-link-active' : ''}`}
                  aria-label={link.label}
                >
                  <span className="side-nav-icon">{link.icon}</span>
                  <span>{link.label.split(' ')[0]}</span>
                </Link>
              )
            })}
          </aside>

          <div>
            {/* Edukids-style hero strip */}
            <MotionSection
              className="card"
              style={{
                marginTop: 12,
                marginBottom: 12,
                borderRadius: 32,
                padding: '18px 22px',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1.2fr)',
                gap: 16,
                alignItems: 'center',
              }}
              variants={cardVariants}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Student profile"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(15,23,42,0.12)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 22,
                        background: theme === 'dark' ? '#111827' : '#fee2e2',
                        color: theme === 'dark' ? '#f9fafb' : '#b91c1c',
                        border: '2px solid rgba(15,23,42,0.08)',
                      }}
                    >
                      {(name || 'S').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: 'Georgia, Times New Roman, serif',
                      fontSize: 22,
                      lineHeight: 1.25,
                      color: theme === 'dark' ? '#f9fafb' : '#3b2c1a',
                    }}
                  >
                    {greeting}, {name || 'Student'}.
                  </div>
                </div>
                <p
                  style={{
                    marginTop: 0,
                    fontSize: 13,
                    color: theme === 'dark' ? '#e5e7eb' : '#6b4f2a',
                    maxWidth: 360,
                  }}
                >
                  Putting your future in great motion. Keep an eye on your attendance, homework and progress – all in one place.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, fontSize: 11 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#fef3c7',
                      border: theme === 'dark' ? '1px solid rgba(248,250,252,0.18)' : '1px solid rgba(248,171,100,0.7)',
                      color: theme === 'dark' ? '#fefce8' : '#6b4f2a',
                    }}
                  >
                    🎯 Focused practice
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#e0f2fe',
                      border: theme === 'dark' ? '1px solid rgba(191,219,254,0.25)' : '1px solid rgba(37,99,235,0.4)',
                      color: theme === 'dark' ? '#e5f2ff' : '#1e293b',
                    }}
                  >
                    📚 Daily progress
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#dcfce7',
                      border: theme === 'dark' ? '1px solid rgba(187,247,208,0.25)' : '1px solid rgba(22,163,74,0.4)',
                      color: theme === 'dark' ? '#bbf7d0' : '#065f46',
                    }}
                  >
                    ⭐ Confidence building
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                  gap: 10,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    padding: '10px 12px',
                    background: '#3b2c1a',
                    color: '#fef3c7',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Attendance</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }} suppressHydrationWarning>
                    {attendanceSummary?.present ?? '--'}%
                  </div>
                  <div style={{ opacity: 0.85 }}>of classes attended</div>
                </div>
                <div
                  style={{
                    borderRadius: 20,
                    padding: '10px 12px',
                    background: '#2563eb',
                    color: '#eff6ff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.9 }}>Today</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {selectedDay ? formatDMYFromYMD(selectedDay) : 'Welcome'}
                  </div>
                  <div style={{ opacity: 0.9 }}>your learning snapshot</div>
                </div>
              </div>
            </MotionSection>

            {/* ROW: Circular / News and Homework / Assignments */}
            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 2fr)',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              {/* Circular / News (using real circulars) - compact pill card */}
              <MotionSection
                className="card"
                style={{ padding: 12, borderRadius: 16 }}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Circulars</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <Link className="back" href="/student/circulars" style={{ fontSize: 11 }}>
                      View
                    </Link>
                    <button
                      type="button"
                      aria-label="Filter circulars"
                      onClick={() => setShowCircularFilter(open => !open)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #f97316, #8b5cf6)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          display: 'inline-block',
                          borderTopLeftRadius: 2,
                          borderTopRightRadius: 2,
                          borderBottomRightRadius: 4,
                          borderBottomLeftRadius: 4,
                          position: 'relative',
                          background: '#ffffff',
                          clipPath: 'polygon(15% 0, 85% 0, 60% 40%, 60% 100%, 40% 100%, 40% 40%)',
                        }}
                      />
                    </button>
                    {showCircularFilter && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 26,
                          right: 0,
                          background: 'var(--panel)',
                          borderRadius: 12,
                          border: '1px solid var(--panel-border)',
                          padding: '8px 10px',
                          boxShadow: '0 16px 32px rgba(15,23,42,0.25)',
                          zIndex: 30,
                          minWidth: 140,
                        }}
                      >
                        {(['today', 'week', 'month'] as CircularFilter[]).map(f => (
                          <label
                            key={f}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11,
                              marginBottom: 4,
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={circularFilter.includes(f)}
                              onChange={() =>
                                setCircularFilter(prev =>
                                  prev.includes(f)
                                    ? prev.filter(x => x !== f)
                                    : [...prev, f],
                                )
                              }
                              style={{ width: 12, height: 12 }}
                            />
                            <span>
                              {f === 'today'
                                ? 'Today'
                                : f === 'week'
                                ? 'This Week'
                                : 'This Month'}
                            </span>
                          </label>
                        ))}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: 6,
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setCircularFilter([])}
                            style={{
                              borderRadius: 999,
                              padding: '3px 8px',
                              fontSize: 10,
                              border: '1px solid rgba(148,163,184,0.7)',
                              background: 'rgba(248,250,252,0.9)',
                              cursor: 'pointer',
                            }}
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCircularFilter(false)}
                            style={{
                              borderRadius: 999,
                              padding: '3px 8px',
                              fontSize: 10,
                              border: '1px solid rgba(37,99,235,0.9)',
                              background: 'rgba(219,234,254,0.95)',
                              cursor: 'pointer',
                            }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {circularsFiltered.length === 0 && (
                  <div className="note" style={{ fontSize: 11 }}>
                    No circulars for this filter.
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {circularsFiltered.slice(0, 3).map((c, idx) => (
                    <MotionDiv
                      variants={itemVariants}
                      key={`${c.title}-${idx}`}
                      className={`note-card note-${CIRCULAR_CARD_COLORS[idx % CIRCULAR_CARD_COLORS.length]}`}
                      style={{
                        borderRadius: 999,
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          maxWidth: '70%',
                        }}
                      >
                        <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.title}
                        </span>
                        <span style={{ opacity: 0.8 }}>
                          {c.date ? formatDMYFromYMD(c.date) : ''}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 999,
                          border: '1px solid rgba(148,163,184,0.6)',
                          background: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {c.tag || 'CIRCULAR'}
                      </span>
                    </MotionDiv>
                  ))}
                </div>
              </MotionSection>

              {/* Homework / Assignments (from diaryEntries) */}
              <MotionSection
                className="card"
                style={{ padding: 16, borderRadius: 16 }}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Homework / Assignments</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link className="back" href="/student/diary" style={{ fontSize: 12 }}>
                      View All
                    </Link>
                    <input
                      className="input diary-date-input"
                      type="date"
                      value={diaryDate}
                      onChange={event => {
                        const next = event.target.value
                        setDiaryDate(next)
                        try { localStorage.setItem('student:lastDiaryDate', next) } catch { }
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: 6,
                    padding: '6px 8px',
                    borderRadius: 10,
                    background: 'var(--panel-soft)',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <div>Subject</div>
                  <div>Created On</div>
                  <div>Due Date</div>
                  <div>Status</div>
                </div>
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  {diaryEntries.length === 0 && (
                    <div className="note">No assignments recorded for this date.</div>
                  )}
                  {diaryEntries.slice(0, 4).map((entry, idx) => (
                    <MotionDiv
                      variants={itemVariants}
                      key={idx}
                      className={`homework-row homework-row-${entry.color}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: 6,
                        alignItems: 'center',
                        borderRadius: 10,
                        padding: '6px 8px',
                        border: '1px solid var(--panel-border)',
                        background:
                          entry.color === 'blue'
                            ? '#dbeafe'
                            : entry.color === 'green'
                              ? '#d1fae5'
                              : entry.color === 'orange'
                                ? '#ffedd5'
                                : 'var(--panel)',
                        color: '#111827',
                      }}
                    >
                      <div>
                        <Link href="/student/diary" className="back" style={{ color: '#111827' }}>
                          {entry.subject}
                        </Link>
                        {entry.note && (
                          <div
                            className="note"
                            style={{
                              fontSize: 11,
                              marginTop: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {entry.note}
                          </div>
                        )}
                        {Array.isArray(entry.attachments) && entry.attachments.length > 0 && (
                          <div
                            className="note"
                            style={{
                              fontSize: 11,
                              marginTop: entry.note ? 2 : 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {(() => {
                              const a: any = entry.attachments?.[0]
                              if (!a) return ''
                              if (a.type === 'link') return a.name || a.url || 'Link'
                              return a.name || 'Attachment'
                            })()}
                          </div>
                        )}
                      </div>
                      <div>{formatDMYFromYMD(diaryDate)}</div>
                      <div>{entry.deadline ? formatDMYFromYMD(entry.deadline) : '—'}</div>
                      <div>
                        <span
                          className="badge"
                          style={{
                            background:
                              entry.status === 'submitted'
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(248,113,113,0.15)',
                            color: entry.status === 'submitted' ? '#047857' : '#b91c1c',
                            border: '1px solid rgba(148,163,184,0.4)',
                          }}
                        >
                          {entry.status === 'submitted' ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </MotionSection>
            </div>

            {/* Small calendar below homework and circulars */}
            <MotionSection
              className="card"
              style={{ padding: 16, borderRadius: 16, marginTop: 18, width: '70%', marginLeft: 'auto', marginRight: 'auto' }}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '2px 6px' }}
                    onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    aria-label="Previous month"
                  >
                    ◀
                  </button>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{monthStr}</div>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '2px 6px' }}
                    onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    aria-label="Next month"
                  >
                    ▶
                  </button>
                </div>
                <Link className="back" href="/student/calendar" style={{ fontSize: 12 }}>
                  View All
                </Link>
              </div>
              <div className="cal-grid cal-grid-compact">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="cal-dow">
                    {d}
                  </div>
                ))}
                {days.map((d, index) => {
                  const ymd = formatYMD(d)
                    const dots = eventsThisMonth.filter(e => e.date === ymd)
                    const primaryColor = dots[0]?.color
                    const isSelected = selectedDay === ymd
                    return (
                      <div
                        key={index}
                      className={`cal-day ${isSameMonth(d) ? '' : 'cal-out'} ${isToday(d) ? 'cal-today' : ''
                        } ${dots.length ? 'cal-has-event' : ''} ${isSelected ? 'cal-selected' : ''}`}
                        data-eventcolor={primaryColor || undefined}
                        onClick={() => {
                          const items = eventsThisMonth.filter(e => e.date === ymd)
                          setSelectedDay(prev => (prev === ymd ? null : ymd))
                          if (items.length) {
                            setEventPopupDate(ymd)
                            setEventPopupItems(items)
                          } else {
                            setEventPopupDate(null)
                            setEventPopupItems([])
                          }
                        }}
                      >
                      <div className="cal-num">{d.getDate()}</div>
                    </div>
                  )
                })}
              </div>
              <div className="cal-mini" style={{ marginTop: 8 }}>
                <span style={{ marginRight: 12 }}>
                  <span className="legend-dot" style={{ background: 'var(--blue)', marginRight: 4 }} />
                  PTM
                </span>
                <span style={{ marginRight: 12 }}>
                  <span className="legend-dot" style={{ background: 'var(--orange)', marginRight: 4 }} />
                  Holiday
                </span>
                <span>
                  <span className="legend-dot" style={{ background: 'var(--green)', marginRight: 4 }} />
                  Event
                </span>
              </div>
            </MotionSection>

            {eventPopupDate && eventPopupItems.length > 0 && (
              <div
                onClick={() => { setEventPopupDate(null); setEventPopupItems([]) }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15,23,42,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 60,
                }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    maxWidth: 420,
                    width: '90%',
                    background: 'var(--panel)',
                    borderRadius: 18,
                    padding: 16,
                    boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      Events on {formatDMYFromYMD(eventPopupDate)}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '2px 8px' }}
                      onClick={() => { setEventPopupDate(null); setEventPopupItems([]) }}
                    >
                      Close
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {eventPopupItems.map((ev, idx) => {
                      const color =
                        ev.color === 'blue'
                          ? 'linear-gradient(135deg, #2563eb, #60a5fa)'
                          : ev.color === 'green'
                          ? 'linear-gradient(135deg, #16a34a, #4ade80)'
                          : ev.color === 'orange'
                          ? 'linear-gradient(135deg, #f97316, #fdba74)'
                          : 'linear-gradient(135deg, #8b5cf6, #c4b5fd)'
                      return (
                        <div
                          key={idx}
                          style={{
                            borderRadius: 14,
                            padding: '10px 12px',
                            border: '1px solid rgba(15,23,42,0.18)',
                            background: color,
                            color: '#0f172a',
                            boxShadow: '0 14px 32px rgba(15,23,42,0.28)',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 13 }}>{ev.title}</div>
                          {ev.tag && (
                            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                              {ev.tag}
                            </div>
                          )}
                          {ev.description && (
                            <div style={{ fontSize: 12, marginTop: 6 }}>
                              {ev.description}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="dash" style={{ marginTop: 24 }}>
              <Link className="back" href="/">
                &larr; Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
