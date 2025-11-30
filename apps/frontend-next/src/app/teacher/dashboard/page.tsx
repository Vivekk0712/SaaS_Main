"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { seedIfNeeded, getClasses, getSectionsForClass, rosterBy, saveAttendance, readAttendance, readAttendanceTopic, saveAttendanceTopic, saveDiary, addCalendarEvent, readCalendarByMonth, getAssignedClassesForTeacher, getAssignedSectionsForTeacher, hourOptionsForClass, getHoursForClass, getAssignedSubjectsForTeacher, getSubjects, getClassSubjects, listTestsForClass, subjectAveragesForTest, getMarkSheet, classAttendanceAverageBefore, classAttendanceAverageBetween, saveAssignment } from '../data'
import { BarChart, type BarSeries } from '../../components/BarChart'

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

export default function TeacherDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [mountedUI, setMountedUI] = React.useState(false)
  React.useEffect(() => { setMountedUI(true) }, [])
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [message, setMessage] = React.useState('')
  const [diaryNote, setDiaryNote] = React.useState('')
  const [diaryDate, setDiaryDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [diaryKlass, setDiaryKlass] = React.useState<string>(() => getClasses()[0] || 'Class 8')
  const [diarySection, setDiarySection] = React.useState<string>(() => getSectionsForClass((getClasses()[0]||''))[0] || 'A')
  const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([])
  const [diarySubject, setDiarySubject] = React.useState<string>('')
  const [diaryDueDate, setDiaryDueDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  React.useEffect(() => {
    setDiarySection(prev => {
      const arr = getSectionsForClass(diaryKlass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [diaryKlass])
  const [linkInput, setLinkInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<any>>([])
  // Profile state
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [profileDraftName, setProfileDraftName] = React.useState('')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [teacherKey, setTeacherKey] = React.useState<string>('')
  // Calendar state
  const [calDate, setCalDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [calTitle, setCalTitle] = React.useState('')
  const [calTag, setCalTag] = React.useState('EVENT')
  const [calEndDate, setCalEndDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [calDesc, setCalDesc] = React.useState('')
  const [calMonth, setCalMonth] = React.useState<string>(() => new Date().toISOString().slice(0,7))
  const [calList, setCalList] = React.useState<Array<any>>([])
  const [calScopeClass, setCalScopeClass] = React.useState<string>('')
  const [calScopeSection, setCalScopeSection] = React.useState<string>('')
  const [attendanceTopic, setAttendanceTopic] = React.useState('')

  // Attendance subjects list (computed client-side)
  const previewPhoto = photoDraft ?? photo

  React.useEffect(() => {
    seedIfNeeded()
    const raw = sessionStorage.getItem('teacher')
    if (raw) {
      const obj = JSON.parse(raw)
      setTeacher(obj)
      if (obj?.name) setTeacherKey(obj.name)
      // Load subjects for this teacher from staff records
      try {
        const tRaw = localStorage.getItem('school:teachers')
        const list = tRaw ? JSON.parse(tRaw) : []
        const rec = Array.isArray(list) ? list.find((x: any) => x.name && obj.name && x.name.toLowerCase() === obj.name.toLowerCase()) : null
        const subs: string[] = rec?.subjects && Array.isArray(rec.subjects) ? rec.subjects : (rec?.subject ? [rec.subject] : (obj.subject ? [obj.subject] : []))
        setTeacherSubjects(subs)
        setDiarySubject(subs[0] || obj.subject || '')
      } catch {}
      try {
        const classes = getAssignedClassesForTeacher(obj.name)
        if (classes.length) {
          setCalScopeClass(classes[0])
          const secs = getAssignedSectionsForTeacher(obj.name, classes[0])
          setCalScopeSection(secs[0] || getSectionsForClass(classes[0])[0] || '')
        } else {
          const all = getClasses()
          const first = all[0] || ''
          setCalScopeClass(first)
          setCalScopeSection(getSectionsForClass(first)[0] || '')
        }
      } catch {}
    }
  }, [])

  // Respond to HOD updates for classes/sections/assignments/subjects
  React.useEffect(() => {
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key as string | undefined
        if (!key) return
        if (key === 'school:assignments' || key === 'school:subjects' || key === 'school:classSubjects' || key === 'school:teachers') {
          if (!teacher) return
          const assigned = getAssignedSubjectsForTeacher(teacher.name, diaryKlass, diarySection)
          const classSubs = getClassSubjects(diaryKlass, diarySection)
          const base = (assigned.length ? assigned : (classSubs.length ? classSubs : (teacherSubjects.length ? teacherSubjects : getSubjects())))
          setDiarySubject(prev => (base.includes(prev) ? prev : (base[0] || prev)))
        }
        if (key === 'school:classSections' || key === 'school:classes') {
          setDiarySection(prev => { const arr = getSectionsForClass(diaryKlass); return arr.includes(prev) ? prev : (arr[0] || prev) })
        }
      } catch {}
    }
    window.addEventListener('school:update', onBus as EventListener)
    return () => window.removeEventListener('school:update', onBus as EventListener)
  }, [teacher, diaryKlass, diarySection, teacherSubjects])

  // Keep diary subject within allowed list for selected class/section
  React.useEffect(() => {
    if (!teacher) return
    const assigned = getAssignedSubjectsForTeacher(teacher.name, diaryKlass, diarySection)
    const classSubs = getClassSubjects(diaryKlass, diarySection)
    const base = (assigned.length ? assigned : (classSubs.length ? classSubs : (teacherSubjects.length ? teacherSubjects : getSubjects())))
    setDiarySubject(prev => (base.includes(prev) ? prev : (base[0] || prev)))
  }, [teacher, teacherSubjects, diaryKlass, diarySection])

  // Load profile overrides and photo when teacher is known
  React.useEffect(() => {
    if (!teacherKey) return
    try {
      const profRaw = localStorage.getItem(`teacher:profile:${teacherKey}`)
      if (profRaw) {
        const prof = JSON.parse(profRaw)
        if (prof?.name) {
          setTeacher(t => t ? { ...t, name: prof.name } : t)
          setProfileDraftName(prof.name)
        }
      } else {
        setProfileDraftName(teacher?.name || '')
      }
    } catch {}
    try {
      const ph = localStorage.getItem(`teacher:photo:${teacherKey}`)
      if (ph) setPhoto(ph)
    } catch {}
  }, [teacherKey])

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDraft(String(reader.result))
    reader.readAsDataURL(file)
  }


  const graphData = React.useMemo(() => {
    const tests = listTestsForClass(calScopeClass || '', (calScopeSection || '') as any).slice(0, 2)
    const classSubs = getClassSubjects(calScopeClass || '', calScopeSection || '')
    const subjects = classSubs.length ? [...classSubs] : getSubjects()
    if (!subjects.length || !tests.length) return { subjects: [] as string[], series: [] as BarSeries[] }
    const palette = ['#2563eb', '#10b981', '#60a5fa', '#34d399']
    const series: BarSeries[] = []
    tests.forEach((t, idx) => {
      const avgs = subjectAveragesForTest(calScopeClass || '', calScopeSection || '', t)
      const map = new Map(avgs.map(x => [x.subject.toLowerCase(), x.pct]))
      const data = subjects.map(sub => map.get(sub.toLowerCase()) ?? null)
      series.push({ name: `${t} Marks %`, color: palette[idx % palette.length], data })
    })
    const chronological = tests
      .map(t => {
        let date = ''
        for (const sub of subjects) {
          const ms = getMarkSheet(calScopeClass || '', calScopeSection || '', sub, t)
          if (ms?.date) {
            date = ms.date
            break
          }
        }
        return {
          t,
          date,
        }
      })
      .filter(e => e.date)
      .sort((a, b) => a.date.localeCompare(b.date))
    const first = chronological[0]
    const second = chronological[1]
    if (first && first.date) {
      const att = subjects.map(sub => classAttendanceAverageBefore(calScopeClass || '', calScopeSection || '', first.date, sub))
      series.push({ name: `${first.t} Attendance %`, color: palette[2], data: att })
    }
    if (first && second && first !== second && first.date && second?.date) {
      const att = subjects.map(sub => classAttendanceAverageBetween(calScopeClass || '', calScopeSection || '', first.date, second.date, sub))
      series.push({ name: `${second.t} Attendance %`, color: palette[3], data: att })
    }
    return { subjects, series }
  }, [calScopeClass, calScopeSection])

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
    { href: '/teacher/students', label: 'Students', icon: '👥' },
    { href: '/teacher/analytics', label: 'Analytics', icon: '📈' },
    { href: '/teacher/assignments', label: 'Assignments', icon: '📚' },
    { href: '/teacher/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/teacher/calendar', label: 'Academic Calendar', icon: '📅' },
    { href: '/teacher/marks', label: 'Marks Entry', icon: '✏️' },
    { href: '/teacher/academic-content', label: 'Academic Content', icon: '📘' },
    { href: '/teacher/circulars', label: 'Circulars', icon: '📣' },
  ]

  const onSaveDiary = () => {
    if (!teacher) return
    const note = diaryNote.trim()
    if (!note && attachments.length === 0) return setMessage('Enter a note or add an attachment.')
    const subj = (diarySubject || teacher.subject || '').trim()
    const entry = {
      subject: subj,
      teacher: teacher.name,
      note,
      klass: diaryKlass,
      section: diarySection as any,
      attachments
    }
    saveDiary(diaryDate, entry)
    // Also create / update an assignment shell for this date & subject (all pending by default)
    try {
      const list = rosterBy(diaryKlass, diarySection as any)
      const items = list.map(s => ({ usn: s.usn, name: s.name, status: 'pending' as const }))
      saveAssignment({
        date: diaryDate,
        deadline: diaryDueDate || diaryDate,
        note,
        attachments,
        subject: subj,
        klass: diaryKlass,
        section: diarySection as any,
        items,
        createdBy: teacher.name
      })
    } catch {}
    setMessage('Diary updated for the selected date.')
    setDiaryNote('')
    setDiaryDueDate(diaryDate)
    setAttachments([])
    setLinkInput('')
    setTimeout(() => setMessage(''), 1500)
  }

  const addLink = () => {
    try {
      const u = new URL(linkInput.trim())
      setAttachments(prev => [{ type: 'link', url: u.toString() }, ...prev])
      setLinkInput('')
    } catch {
      setMessage('Enter a valid URL starting with http or https')
      setTimeout(() => setMessage(''), 1200)
    }
  }

  const addFiles = async (files?: FileList | null) => {
    if (!files) return
    const items: any[] = []
    for (const f of Array.from(files)) {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onerror = () => rej(''); r.onload = () => res(String(r.result)); r.readAsDataURL(f)
      })
      items.push({ type: 'file', name: f.name, mime: f.type || 'application/octet-stream', dataUrl })
    }
    if (items.length) setAttachments(prev => [...items, ...prev])
  }

  // Calendar actions
  const refreshCalList = React.useCallback(() => {
    try {
      const qp = new URLSearchParams({ ym: calMonth })
      if (calScopeClass) qp.set('klass', calScopeClass)
      if (calScopeSection) qp.set('section', calScopeSection)
      if (calScopeClass) qp.set('includeGlobal', '0')
      fetch(`/api/mysql/teacher/calendar?${qp.toString()}`).then(r=>r.json()).then(j => {
        setCalList(Array.isArray(j?.items) ? j.items : [])
      }).catch(() => { setCalList([]) })
    } catch { setCalList([]) }
  }, [calMonth, calScopeClass, calScopeSection])

  React.useEffect(() => { refreshCalList() }, [refreshCalList])
  React.useEffect(() => {
    const refresh = () => { refreshCalList() }
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:calendar') refresh() }
    const onBus = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [calMonth])

  const nextDay = (ymd: string) => {
    const d = new Date(ymd)
    d.setDate(d.getDate() + 1)
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }

  const onAddCalendarEvent = () => {
    if (!teacher) return
    if (!calTitle.trim()) { setMessage('Enter event title'); setTimeout(()=>setMessage(''), 1200); return }
    const tag = (calTag || 'EVENT').trim()
    const upper = tag.toUpperCase()
    const color: 'blue'|'green'|'orange' = upper.includes('PTM')
      ? 'blue'
      : upper.includes('HOLIDAY')
      ? 'orange'
      : 'green'
    const start = new Date(calDate)
    const end = new Date(calEndDate || calDate)
    if (end < start) end.setTime(start.getTime())
    const days: string[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const m = (cursor.getMonth() + 1).toString().padStart(2, '0')
      const d = cursor.getDate().toString().padStart(2, '0')
      days.push(`${cursor.getFullYear()}-${m}-${d}`)
      cursor.setDate(cursor.getDate() + 1)
    }
    days.forEach(d => {
      const payload: any = {
        date: d,
        title: calTitle.trim(),
        tag,
        color,
        description: calDesc.trim(),
        createdBy: teacher.name,
      }
      if (calScopeClass) {
        payload.klass = calScopeClass
        if (calScopeSection) payload.section = calScopeSection
      }
      addCalendarEvent(payload)
    })
    setMessage('Calendar event added.')
    setCalDesc(''); setCalTitle('')
    refreshCalList()
  }

  const combinedCalList = React.useMemo(() => {
    if (!calList.length) return []
    const sorted = [...calList].sort((a, b) => {
      if (a.title !== b.title) return a.title.localeCompare(b.title)
      if (a.tag !== b.tag) return a.tag.localeCompare(b.tag)
      if (a.color !== b.color) return a.color.localeCompare(b.color)
      if ((a.klass || '') !== (b.klass || '')) return (a.klass || '').localeCompare(b.klass || '')
      if ((a.section || '') !== (b.section || '')) return (a.section || '').localeCompare(b.section || '')
      return a.date.localeCompare(b.date)
    })
    const out: Array<{
      title: string
      tag: string
      color: string
      start: string
      end: string
      description?: string
      createdBy: string
      klass?: string
      section?: string
    }> = []
    let current = null as any
    const pushCurrent = () => { if (current) out.push(current); current = null }
    for (const ev of sorted) {
      const key =
        `${ev.title}||${ev.tag}||${ev.color}||${ev.klass || ''}||${ev.section || ''}||${ev.createdBy || ''}`
      const curKey = current
        ? `${current.title}||${current.tag}||${current.color}||${current.klass || ''}||${current.section || ''}||${current.createdBy || ''}`
        : null
      if (!current || key !== curKey || ev.date > current.end || ev.date < current.start || ev.date > current.end && ev.date !== nextDay(current.end)) {
        pushCurrent()
        current = {
          title: ev.title,
          tag: ev.tag,
          color: ev.color,
          start: ev.date,
          end: ev.date,
          description: ev.description,
          createdBy: ev.createdBy,
          klass: ev.klass,
          section: ev.section,
        }
      } else {
        if (ev.date < current.start) current.start = ev.date
        if (ev.date > current.end) current.end = ev.date
        // Prefer a non-empty description if present
        if (!current.description && ev.description) current.description = ev.description
      }
    }
    pushCurrent()
    return out
  }, [calList])

  if (!mountedUI) {
    return (
      <div>
        <div className="topbar">
          <div className="topbar-inner">
            <div className="brand-mark"><span className="dot" /><strong>Teacher</strong></div>
          </div>
        </div>
        <div className="dash-wrap"><div className="dash"><p className="subtitle">Loading…</p></div></div>
      </div>
    )
  }

  return (
    <div>
          <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Teacher</strong>
          </div>
          <nav className="tabs" aria-label="Teacher navigation">
            {navLinks.filter(link => link.href !== '/teacher/diary' && link.href !== '/teacher/calendar').map(link => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  className={`tab ${active ? 'tab-active' : ''}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <div className="actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button className="btn-ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? 'Dark' : 'Light'}
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
                ref={avatarRef}
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
                  <label className="label">Name</label>
                  <input className="input" value={profileDraftName} onChange={e=>setProfileDraftName(e.target.value)} placeholder="Teacher name" />
                </div>
                <div className="field">
                  <label className="label">Subject</label>
                  <input className="input" value={teacher?.subject || ''} readOnly />
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
                      const trimmed = profileDraftName.trim() || (teacher?.name || 'Teacher')
                      if (teacher) {
                        const payload = { ...teacher, name: trimmed }
                        sessionStorage.setItem('teacher', JSON.stringify(payload))
                        setTeacher(payload)
                      }
                      if (teacherKey) {
                        try { localStorage.setItem(`teacher:profile:${teacherKey}`, JSON.stringify({ name: trimmed, password: profileDraftPassword.trim() || '' })) } catch {}
                        if (photoDraft) { try { localStorage.setItem(`teacher:photo:${teacherKey}`, photoDraft) } catch {} }
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

      {/* Close profile menu on outside click / Escape */}
      {menuOpen && (
        <ProfileMenuCloser onClose={() => { setMenuOpen(false); setPhotoDraft(null); setProfileDraftPassword(''); setProfileMessage('') }} anchorRef={avatarRef} menuRef={menuRef} />
      )}

      <div className="dash-wrap">
        <div className="dash-layout">
          <aside className="side-nav" aria-label="Teacher quick navigation">
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
                marginBottom: 16,
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
                      alt="Teacher profile"
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
                      {(teacher?.name || 'T').slice(0, 1).toUpperCase()}
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
                    Welcome{teacher ? `, ${teacher.name}` : ''}.
                  </div>
                </div>
                <p
                  style={{
                    marginTop: 0,
                    fontSize: 13,
                    color: theme === 'dark' ? '#e5e7eb' : '#6b4f2a',
                    maxWidth: 380,
                  }}
                >
                  Plan your classes, mark attendance and keep parents informed — all from one
                  place.
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
                    📚 {teacherSubjects.length ? teacherSubjects.join(', ') : 'Subjects'}
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
                    👨‍👩‍👧 Class analytics
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
                    ✏️ Attendance & diary
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
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Focus class</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {calScopeClass || 'Class'} {calScopeSection}
                  </div>
                  <button
                    type="button"
                    className="btn-tiny"
                    style={{ marginTop: 4, alignSelf: 'flex-start' }}
                    onClick={() => router.push('/teacher/students')}
                  >
                    View students
                  </button>
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
                    Use the Attendance tab to mark periods
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 18, padding: 16, borderRadius: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>Class performance snapshot</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
                  <select
                    className="input select"
                    value={calScopeClass}
                    onChange={(e) => {
                      const value = e.target.value
                      setCalScopeClass(value)
                      const secs = getAssignedSectionsForTeacher(teacher?.name || '', value)
                      setCalScopeSection(secs[0] || getSectionsForClass(value)[0] || '')
                    }}
                  >
                    {(teacher
                      ? getAssignedClassesForTeacher(teacher.name).length
                        ? getAssignedClassesForTeacher(teacher.name)
                        : getClasses()
                      : getClasses()
                    ).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    className="input select"
                    value={calScopeSection}
                    onChange={(e) => setCalScopeSection(e.target.value)}
                  >
                    {(calScopeClass
                      ? getAssignedSectionsForTeacher(teacher?.name || '', calScopeClass).length
                        ? getAssignedSectionsForTeacher(teacher?.name || '', calScopeClass)
                        : getSectionsForClass(calScopeClass)
                      : []
                    ).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {graphData.subjects.length === 0 && (
                <div className="note">No tests recorded yet for this class/section.</div>
              )}
              {graphData.subjects.length > 0 && (
                <BarChart
                  title="Marks & attendance snapshot"
                  categories={graphData.subjects}
                  series={graphData.series}
                  yMax={100}
                />
              )}
            </div>

            <div className="dash" style={{ marginTop: 24 }}>
              <Link className="back" href="/">&larr; Back to login</Link>
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
