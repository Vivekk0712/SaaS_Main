"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import {
  findStudent,
  readDiaryBy,
  readAssignments,
  readAssignmentStatusForStudent,
  readCalendarByMonth,
  readMarksByStudent,
  readCircularsByClassSection
} from '../../teacher/data'

type EventColor = 'blue' | 'green' | 'orange'

type CircularFilter = 'today' | 'week' | 'month'

const CIRCULAR_CARD_COLORS = ['blue','green','orange','pink'] as const

// Simple helper to build a fixed 6x7 month grid starting on Monday
function getMonthMatrix(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first)
  // shift back to Monday (0 = Sunday in JS)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark')
      }
    } catch {}
  }, [])
  React.useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme, mounted])
  return { theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) }
}

function ymOf(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}

function formatDMYFromYMD(ymd: string) {
  return `${ymd.slice(8,10)}/${ymd.slice(5,7)}/${ymd.slice(0,4)}`
}

export default function ParentDashboard() {
  const pathname = usePathname()
  const { toggle, theme } = useTheme()
  // Profile state
  const [parentName, setParentName] = React.useState<string>('Parent')
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [profileDraftName, setProfileDraftName] = React.useState('Parent')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const mobileNavRef = React.useRef<HTMLDivElement | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [childRoll, setChildRoll] = React.useState<string>('')
  const [childName, setChildName] = React.useState<string>('')
  const [childUsn, setChildUsn] = React.useState<string>('')
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<'A' | 'B' | ''>('')
  const [feeTotal, setFeeTotal] = React.useState<number>(0)
  const [feeTotalDue, setFeeTotalDue] = React.useState<number>(0)
  const [diaryDate, setDiaryDate] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('parent:lastDiaryDate')
        if (stored) return stored
      } catch {}
    }
    return new Date().toISOString().slice(0, 10)
  })
  const [diaryEntries, setDiaryEntries] = React.useState<
    Array<{
      subject: string
      teacher: string
      note: string
      attachments?: any[]
      color: EventColor
      status: 'pending' | 'submitted'
      deadline?: string
    }>
  >([])
  const [month, setMonth] = React.useState<Date>(() => new Date())
  const [notifications, setNotifications] = React.useState<Array<{date:string; title:string; tag:string; color:EventColor; description:string}>>([])
  const [nextDue, setNextDue] = React.useState<{ amount:number; dueDate?:string } | null>(null)
  const [overdueCount, setOverdueCount] = React.useState<number>(0)
  const [progress, setProgress] = React.useState<Array<{ test:string; subject:string; score:number; max:number; date?:string; klass:string; section:string }>>([])
  const [circulars, setCirculars] = React.useState<
    Array<{ title: string; date: string; tag: string }>
  >([])

  React.useEffect(() => {
    // Mirror ParentDiaryPage logic so klass/section/usn match wherever homework is shown
    const load = async () => {
      try {
        const raw = sessionStorage.getItem('parent')
        if (!raw) return
        const sess = JSON.parse(raw)
        if (sess?.name) {
          setParentName(String(sess.name))
          setProfileDraftName(String(sess.name))
        }
        let roll = String(sess.roll || '')
        if (!roll && sess.phone) {
          try {
            const j = await (await fetch('/api/mysql/profiles/students')).json()
            const mine = (j.items || []).find(
              (s: any) => String(s.parentPhone || '') === String(sess.phone),
            )
            if (mine) {
              roll = String(mine.usn || '')
              setChildName(mine.name || '')
              setKlass(mine.grade || '')
              setSection((mine.section as any) || '')
              setChildUsn(roll)
              setChildRoll(roll)
              sessionStorage.setItem('parent', JSON.stringify({ ...sess, roll }))
              try {
                if (roll) setProgress(readMarksByStudent(roll))
              } catch {}
              return
            }
          } catch {}
        }
        if (roll) {
          const me = findStudent(roll)
          if (me) {
            setChildName(me.name)
            setKlass(me.klass)
            setSection(me.section as any)
            setChildUsn(me.usn)
            setChildRoll(me.usn)
            try {
              if (me.usn) setProgress(readMarksByStudent(me.usn))
            } catch {}
          }
        }
      } catch {}
    }
    load()
  }, [])

  React.useEffect(() => {
    const loadDue = async () => {
      try {
        const raw = sessionStorage.getItem('parent')
        if (!raw) return
        const { phone } = JSON.parse(raw)
        if (!phone) return
        const fees = await (
          await fetch(`/api/local/parent/fees?phone=${encodeURIComponent(phone)}`)
        ).json()
        if (fees && Array.isArray(fees.parts)) {
          const paid = Array.isArray(fees.paidParts) ? fees.paidParts : []
          const total = (fees.items || []).reduce(
            (sum: number, it: any) => sum + Number(it.amount || 0),
            0,
          )
          const totalDue = fees.parts.reduce(
            (sum: number, p: any, idx: number) =>
              sum + (!paid[idx] ? Number(p?.amount || 0) : 0),
            0,
          )
          setFeeTotal(total)
          setFeeTotalDue(totalDue)
          const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
          const overdue = fees.parts.filter((p:any, i:number) => !paid[i] && p?.dueDate && (new Date(p.dueDate).setHours(0,0,0,0) < startOfToday.getTime())).length
          setOverdueCount(overdue)
          if (typeof fees.nextIndex === 'number' && fees.nextIndex >= 0) {
            const p = fees.parts[fees.nextIndex]
            setNextDue({ amount: Number(p?.amount||0), dueDate: p?.dueDate })
          } else {
            setNextDue(null)
          }
        } else { setNextDue(null); setOverdueCount(0); setFeeTotal(0); setFeeTotalDue(0) }
      } catch {}
    }
    loadDue()
    const id = setInterval(loadDue, 5000)
    return () => clearInterval(id)
  }, [])

  // Refresh progress when child's roll changes in session (e.g., after login refresh)
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('parent')
      if (!raw) return
      const { roll } = JSON.parse(raw)
      if (roll) setProgress(readMarksByStudent(roll))
    } catch {}
  }, [pathname])

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDraft(String(reader.result))
    reader.readAsDataURL(file)
  }

  const previewPhoto = photoDraft ?? photo

  // Homework / assignments preview for dashboard (same data flow as student dashboard, but using child's class/section)
  React.useEffect(() => {
    const recomputeDiary = () => {
      try {
        if (!klass || !section) {
          setDiaryEntries([])
          return
        }

        let arr: any[] = readDiaryBy(diaryDate, klass, section as any)

        if (!arr || !arr.length) {
          try {
            const backup = readAssignments(diaryDate, klass, section as any)
            if (backup && backup.length) {
              arr = backup.map(a => ({
                subject: a.subject || 'Subject',
                teacher: a.createdBy || 'Teacher',
                note: a.note || '',
                status: 'pending',
                attachments: a.attachments || [],
              }))
            }
          } catch {}
        }

        const mapped = (arr || []).map((e: any, idx: number) => {
          let status: 'pending' | 'submitted' =
            e.status === 'submitted' ? 'submitted' : 'pending'
          let deadline: string | undefined = e.deadline
          try {
            if (klass && section && childUsn && e.subject) {
              const s = readAssignmentStatusForStudent(
                diaryDate,
                klass,
                section as any,
                e.subject,
                childUsn,
              )
              if (s?.status) status = s.status
              if (s?.deadline) deadline = s.deadline
            }
          } catch {}
          return {
            subject: e.subject || 'Subject',
            teacher: e.teacher || e.createdBy || 'Teacher',
            note: e.note || '',
            attachments: e.attachments || [],
            color: (['blue', 'green', 'orange'] as EventColor[])[idx % 3],
            status,
            deadline,
          }
        })

        setDiaryEntries(mapped)
      } catch {
        setDiaryEntries([])
      }
    }

    recomputeDiary()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:diary' || e.key === 'school:studentAssignments') recomputeDiary()
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key || key === 'school:diary' || key === 'school:studentAssignments')
          recomputeDiary()
      } catch {
        recomputeDiary()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [diaryDate, klass, section, childUsn])

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

  React.useEffect(() => {
    // Notifications: reuse academic calendar entries of the current month
    try {
      setNotifications(readCalendarByMonth(ymOf(month), klass || undefined, section || undefined) as any)
    } catch {
      setNotifications([])
    }
  }, [month, klass, section])

  // Circulars preview for dashboard (per child's class/section)
  const recomputeCirculars = React.useCallback(() => {
    try {
      if (!klass || !section) {
        setCirculars([])
        return
      }
      const list = readCircularsByClassSection(klass, section as 'A' | 'B')
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
  }, [klass, section])

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

  const [circularFilter, setCircularFilter] = React.useState<CircularFilter[]>(['month'])
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

  const eventsThisMonth = React.useMemo(
    () => notifications.filter(e => e.date.slice(0, 7) === ymOf(month)),
    [notifications, month]
  )
  const [eventPopupDate, setEventPopupDate] = React.useState<string | null>(null)
  const [eventPopupItems, setEventPopupItems] = React.useState<typeof notifications>([])

  const greeting = React.useMemo(() => {
    const now = new Date()
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const [showCircularFilter, setShowCircularFilter] = React.useState(false)

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/parent/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/parent/progress', label: 'Progress', icon: '📊' },
    { href: '/parent/attendance', label: 'Attendance', icon: '✅' },
    { href: '/parent/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/parent/calendar', label: 'Calendar', icon: '📅' },
    { href: '/parent/circulars', label: 'Circulars', icon: '📣' },
    { href: '/parent/payments', label: 'Payments', icon: '💳' }
  ]

  return (
    <div className="parent-shell">
      <div className="topbar topbar-parent">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Parent</strong>
          </div>
          <nav className="tabs" aria-label="Parent quick actions">
            {navLinks
              .filter(link =>
                link.href === '/parent/progress' ||
                link.href === '/parent/attendance' ||
                link.href === '/parent/payments'
              )
              .map(link => {
                const active = pathname?.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`tab ${active ? 'tab-active' : ''}`}
                  >
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
            <button className="btn-ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            {photo ? (
              <img
                ref={avatarRef as React.MutableRefObject<HTMLImageElement | null>}
                src={photoDraft ?? photo}
                alt="Profile"
                className="avatar"
                onClick={() => setMenuOpen(o => !o)}
              />
            ) : (
              <div
                ref={avatarRef as React.RefObject<HTMLDivElement>}
                className="avatar"
                aria-label="Set profile photo"
                title="Set profile photo"
                onClick={() => setMenuOpen(o => !o)}
              />
            )}
            {menuOpen && (
              <div ref={menuRef} className="menu" role="dialog" aria-label="Profile settings">
                <div className="menu-title">Profile Settings</div>
                <div className="field">
                  <label className="label">Parent Name</label>
                  <input className="input" value={profileDraftName} onChange={e=>setProfileDraftName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="field">
                  <label className="label">Child Roll</label>
                  <input className="input" value={childRoll} readOnly />
                </div>
                <div className="field">
                  <label className="label">Reset Password (simple)</label>
                  <input className="input" type="password" value={profileDraftPassword} onChange={e=>setProfileDraftPassword(e.target.value)} placeholder="Enter new simple password" />
                </div>
                <div className="field">
                  <label className="label">Profile Photo</label>
                  <input className="input" type="file" accept="image/*" onChange={e=>onPhotoChange(e.target.files?.[0])} />
                  {photoDraft && <div className="profile-preview">Preview ready. Save to keep changes.</div>}
                </div>
                {profileMessage && <div className="profile-message">{profileMessage}</div>}
                <div className="actions">
                  <button className="btn" type="button" onClick={() => {
                    try {
                      const trimmed = profileDraftName.trim() || 'Parent'
                      // Update session for convenience
                      const raw = sessionStorage.getItem('parent')
                      const payload = raw ? { ...JSON.parse(raw), name: trimmed } : { roll: childRoll, name: trimmed }
                      sessionStorage.setItem('parent', JSON.stringify(payload))
                      setParentName(trimmed)
                      if (childRoll) {
                        try { localStorage.setItem(`parent:profile:${childRoll}`, JSON.stringify({ name: trimmed, password: profileDraftPassword.trim() || '' })) } catch {}
                        if (photoDraft) { try { localStorage.setItem(`parent:photo:${childRoll}`, photoDraft) } catch {} }
                        if (photoDraft) { setPhoto(photoDraft); setPhotoDraft(null) }
                      }
                      setProfileDraftPassword('')
                      setProfileMessage('Profile updated successfully.')
                    } catch {
                      setProfileMessage('Could not update profile. Please try again.')
                    }
                  }}>Save changes</button>
                  <button className="btn-ghost" type="button" onClick={() => { setMenuOpen(false); setPhotoDraft(null); setProfileDraftPassword(''); setProfileMessage('') }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav for small screens */}
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

      {/* Close profile menu on outside click / Escape */}
      {menuOpen && (
        <ProfileMenuCloser onClose={() => { setMenuOpen(false); setPhotoDraft(null); setProfileDraftPassword(''); setProfileMessage('') }} anchorRef={avatarRef} menuRef={menuRef} />
      )}

      <div className="dash-wrap parent-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-parent" aria-label="Parent quick navigation">
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
            <div
              className="card"
              style={{
                padding: '18px 22px',
                borderRadius: 24,
                marginBottom: 12,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1.3fr)',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Parent profile"
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
                      {(parentName || 'P').slice(0, 1).toUpperCase()}
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
                    {greeting}, {parentName || 'Parent'}.
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
                  Staying close to your child&apos;s learning. Track attendance, homework, tests and
                  fees in one simple view.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, fontSize: 11 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#fef3c7',
                      border:
                        theme === 'dark'
                          ? '1px solid rgba(248,250,252,0.18)'
                          : '1px solid rgba(248,171,100,0.7)',
                      color: theme === 'dark' ? '#fefce8' : '#6b4f2a',
                    }}
                  >
                    👨‍👩‍👧 Parent overview
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#e0f2fe',
                      border:
                        theme === 'dark'
                          ? '1px solid rgba(191,219,254,0.25)'
                          : '1px solid rgba(37,99,235,0.4)',
                      color: theme === 'dark' ? '#e5f2ff' : '#1e293b',
                    }}
                  >
                    📚 Homework & tests
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#dcfce7',
                      border:
                        theme === 'dark'
                          ? '1px solid rgba(187,247,208,0.25)'
                          : '1px solid rgba(22,163,74,0.4)',
                      color: theme === 'dark' ? '#bbf7d0' : '#065f46',
                    }}
                  >
                    💳 Fees & reminders
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
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Child</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {childName || 'Child'}{childRoll ? ` (${childRoll})` : ''}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 11 }}>
                    {klass && section ? `${klass} • ${section}` : 'Class details not linked yet'}
                  </div>
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
                    {new Date().toLocaleDateString()}
                  </div>
                  <div style={{ opacity: 0.9, fontSize: 11 }}>
                    monitoring attendance, homework and fees
                  </div>
                </div>
              </div>
            </div>

            {(nextDue || overdueCount > 0) && (
              <div
                className="card"
                style={{
                  margin: '12px 0',
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                {nextDue && (
                  <div>
                    <div className="label">Next Due</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>
                      {Number(nextDue.amount || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </div>
                    <div className="note">
                      {nextDue.dueDate
                        ? `Due on ${new Date(nextDue.dueDate).toLocaleDateString()}`
                        : 'No date set'}
                    </div>
                  </div>
                )}
                {overdueCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div className="label">Reminders</div>
                    <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 18 }}>
                      {overdueCount} overdue
                    </div>
                  </div>
                )}
                <a className="btn-tiny" href="/parent/payments">
                  Pay
                </a>
              </div>
            )}

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                // Slightly smaller right column so cards sit side‑by‑side without overlapping
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 2.2fr)',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              {/* Left column: fee summary + homework preview */}
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Compact fee summary (mirroring payments page) */}
                <section className="card" style={{ padding: 12, borderRadius: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Fee Summary</div>
                    <Link className="back" href="/parent/payments" style={{ fontSize: 11 }}>
                      View Details
                    </Link>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.2fr) auto minmax(0, 1.2fr)',
                      gap: 8,
                      alignItems: 'stretch',
                    }}
                  >
                    {/* Total & Late */}
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div
                        className="card fee-card fee-card-total"
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          boxShadow: 'none',
                          border: '1px solid rgba(129,140,248,0.45)',
                          background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                        }}
                      >
                        <div
                          className="label"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                        >
                          <span>💰</span>
                          <span>Total</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                          {feeTotal.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          })}
                        </div>
                      </div>
                      <div
                        className="card fee-card fee-card-late"
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          boxShadow: 'none',
                          border: '1px solid rgba(251,191,36,0.55)',
                          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                        }}
                      >
                        <div
                          className="label"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                        >
                          <span>🔐</span>
                          <span>Late</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>₹0</div>
                      </div>
                    </div>

                    {/* Center: paid circle */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 96,
                          height: 96,
                          borderRadius: '50%',
                          background: '#eff6ff',
                          border: '4px solid #2563eb',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: '#1d4ed8',
                          }}
                        >
                          {(feeTotal - feeTotalDue).toLocaleString('en-IN', {
                            maximumFractionDigits: 0,
                          })}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            marginTop: 2,
                            color: '#1f2933',
                          }}
                        >
                          Paid Fees
                        </div>
                      </div>
                    </div>

                    {/* Due & Advance */}
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div
                        className="card fee-card fee-card-due"
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          boxShadow: 'none',
                          border: '1px solid rgba(248,113,113,0.55)',
                          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                        }}
                      >
                        <div
                          className="label"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                        >
                          <span>📅</span>
                          <span>Due</span>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginTop: 2,
                            color: feeTotalDue ? '#b91c1c' : 'var(--success)',
                          }}
                        >
                          {feeTotalDue.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          })}
                        </div>
                      </div>
                      <div
                        className="card fee-card fee-card-advance"
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          boxShadow: 'none',
                          border: '1px solid rgba(34,197,94,0.55)',
                          background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                        }}
                      >
                        <div
                          className="label"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                        >
                          <span>💳</span>
                          <span>Advance</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>₹0</div>
                      </div>
                    </div>
                  </div>
                </section>
                {/* Homework / Assignments – preview (below fee summary) */}
                <section className="card" style={{ padding: 16, borderRadius: 18 }}>
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
                      <Link className="back" href="/parent/diary" style={{ fontSize: 12 }}>
                        View All
                      </Link>
                      <input
                        className="input diary-date-input"
                        type="date"
                        value={diaryDate}
                        onChange={event => {
                          const next = event.target.value
                          setDiaryDate(next)
                          try {
                            localStorage.setItem('parent:lastDiaryDate', next)
                          } catch {}
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
                    {diaryEntries.slice(0, 3).map((entry, idx) => (
                      <div
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
                          <Link
                            href="/parent/diary"
                            className="back"
                            style={{ color: '#111827' }}
                          >
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
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right column: Circular / News */}
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Circular / News – top-right */}
                <section className="card" style={{ padding: 20, borderRadius: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Circular / News</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
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
                      <Link className="back" href="/parent/circulars" style={{ fontSize: 12 }}>
                        View All
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
                    </div>
                  </div>
                  {circularsFiltered.length === 0 && (
                    <div className="note">No circulars or news for this filter.</div>
                  )}
                  <div style={{ display: 'grid', gap: 8 }}>
                    {circularsFiltered.slice(0, 4).map((c, idx) => (
                      <div
                        key={`${c.title}-${idx}`}
                        className={`note-card note-${CIRCULAR_CARD_COLORS[idx % CIRCULAR_CARD_COLORS.length]}`}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>
                            Circular
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                            {c.title}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                          {c.date ? formatDMYFromYMD(c.date) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>

            {/* Small calendar – centered and wider, similar to student dashboard */}
            <section className="card" style={{ padding: 16, borderRadius: 18, width: '70%', margin: '18px auto 0' }}>
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
                    onClick={() =>
                      setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
                    }
                    aria-label="Previous month"
                  >
                    ◀
                  </button>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {new Date(month).toLocaleString('en', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '2px 6px' }}
                    onClick={() =>
                      setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
                    }
                    aria-label="Next month"
                  >
                    ▶
                  </button>
                </div>
                <Link className="back" href="/parent/calendar" style={{ fontSize: 12 }}>
                  View All
                </Link>
              </div>
              <div className="cal-grid cal-grid-compact">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="cal-dow">
                    {d}
                  </div>
                ))}
                {getMonthMatrix(month).map((d, index) => {
                  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                    2,
                    '0',
                  )}-${String(d.getDate()).padStart(2, '0')}`
                  const dots = eventsThisMonth.filter(e => e.date === ymd)
                  const primaryColor = dots[0]?.color
                  return (
                    <div
                      key={index}
                      className={`cal-day ${
                        d.getMonth() === month.getMonth() ? '' : 'cal-out'
                      } ${
                        new Date().toDateString() === d.toDateString() ? 'cal-today' : ''
                      } ${dots.length ? 'cal-has-event' : ''}`}
                      data-eventcolor={primaryColor || undefined}
                      onClick={() => {
                        const items = eventsThisMonth.filter(e => e.date === ymd)
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
            </section>

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
    </div>
  )
}

function ProfileMenuCloser({ onClose, anchorRef, menuRef }: { onClose: () => void; anchorRef: React.RefObject<HTMLElement | null>; menuRef: React.RefObject<HTMLDivElement | null> }) {
  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (anchorRef.current && (anchorRef.current as any).contains && (anchorRef.current as any).contains(target)) return
      onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, anchorRef, menuRef])
  return null
}
