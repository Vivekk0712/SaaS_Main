"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getClasses, getSectionsForClass, getSubjects, addCalendarEvent, addSubject, addClass, removeClass, addSectionToClass, removeSectionFromClass, listAssignments, saveAssignments, type TeachingAssignment, readCalendarByMonth, getHoursForClass, setHoursForClass, addSubjectToClassSection, removeSubjectFromClassSection, getClassSubjects, listTestsForClass, subjectAveragesForTest, getMarkSheet, readTotalsByTest, listTestsBySubject, rosterBy } from '../../teacher/data'
import { LineChart, type LineSeries } from '../../components/LineChart'
import { BarChart, type BarSeries } from '../../components/BarChart'
import { PieChart } from '../../components/PieChart'
import { subjectColor, type ColorTag } from '../../lib/colors'
import StudentsManager from './students-manager'

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (stored === 'light' || stored === 'dark') setTheme(stored)
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark')
    } catch {}
  }, [])

  // (moved to AdminDashboard)
  React.useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme, mounted])
  return { theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) }
}

type Staff = { name: string; subjects?: string[]; subject?: string; role: string }
type Student = { usn: string; name: string; klass: string; section: 'A'|'B' }

export default function AdminDashboard() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  // Profile
  const [admin, setAdmin] = React.useState<{ user: string; dept: string } | null>(null)
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [profileDraftName, setProfileDraftName] = React.useState('')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  // Tabs
  const tabs = ['Overview','Calendar','Setup','Staff','Students','Performance','Students Portal'] as const
  type Tab = typeof tabs[number]
  const [tab, setTab] = React.useState<Tab>('Overview')

  // Calendar state (reuse teacher flow)
  const [calDate, setCalDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [calTitle, setCalTitle] = React.useState('')
  const [calTag, setCalTag] = React.useState('EVENT')
  const [calColor, setCalColor] = React.useState<'blue'|'green'|'orange'|'pink'|'violet'>('blue')
  const [calDesc, setCalDesc] = React.useState('')
  const [calScopeClass, setCalScopeClass] = React.useState<string>('')
  const [calScopeSection, setCalScopeSection] = React.useState<string>('')
  // Full calendar view state
  const [month, setMonth] = React.useState<Date>(() => new Date())
  const monthStr = `${MONTHS[month.getMonth()]} ${month.getFullYear()}`
  const [eventsThisMonth, setEventsThisMonth] = React.useState<Array<{date:string; title:string; color:string; description:string; tag:string}>>([])

  // Staff management
  const [staff, setStaff] = React.useState<Staff[]>([])
  const [sName, setSName] = React.useState('')
  const [sSubjects, setSSubjects] = React.useState<string[]>([])
  const [sRole, setSRole] = React.useState('Teacher')

  // Students
  const [students, setStudents] = React.useState<Student[]>([])
  const [nUsn, setNUsn] = React.useState('')
  const [nName, setNName] = React.useState('')
  const [nKlass, setNKlass] = React.useState(() => getClasses()[0] || '')
  const [nSection, setNSection] = React.useState<string>(() => (getSectionsForClass((getClasses()[0]||''))[0] || ''))

  // Setup
  const [newSubj, setNewSubj] = React.useState('')
  const [subKlass, setSubKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [subSection, setSubSection] = React.useState<string>(() => getSectionsForClass((getClasses()[0]||''))[0] || '')
  React.useEffect(() => { setSubSection(prev => { const arr = getSectionsForClass(subKlass); return arr.includes(prev) ? prev : (arr[0] || '') }) }, [subKlass])
  const [resetMsg, setResetMsg] = React.useState('')
  // Assignments inline under Staff
  const [assigns, setAssigns] = React.useState<TeachingAssignment[]>(() => listAssignments())
  const [aTeacher, setATeacher] = React.useState<string>('')
  const [aClass, setAClass] = React.useState<string>('')
  const [aSection, setASection] = React.useState<string>('')
  const [aSubject, setASubject] = React.useState<string>('')

  // Assignments removed per requirements

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('admin')
      if (raw) {
        const a = JSON.parse(raw)
        setAdmin(a)
        setProfileDraftName(a.user || 'HOD')
        const ph = localStorage.getItem(`hod:photo:${a.dept}`)
        if (ph) setPhoto(ph)
      }
    } catch {}
    // Prime teachers from DB (fallback to local)
    try {
      fetch('/api/mysql/teachers/list').then(r=>r.json()).then(j => {
        if (j && Array.isArray(j.items)) {
          const arr = j.items.map((it:any) => ({ name: String(it.name||''), subjects: Array.isArray(it.subjects)? it.subjects: [] }))
          localStorage.setItem('school:teachers', JSON.stringify(arr))
          setStaff(arr as any)
        }
      }).catch(()=>{
        const tRaw = localStorage.getItem('school:teachers')
        setStaff(tRaw ? JSON.parse(tRaw) : [])
      })
    } catch { setStaff([]) }
    // Prime students from DB (fallback to local)
    try {
      fetch('/api/mysql/profiles/students').then(r=>r.json()).then(j => {
        if (j && Array.isArray(j.items)) {
          const arr = j.items.map((it:any) => ({ usn: String(it.roll||''), name: String(it.name||''), klass: String(it.grade||''), section: String(it.section||'') }))
          localStorage.setItem('school:students', JSON.stringify(arr))
          setStudents(arr as any)
        }
      }).catch(()=>{
        const sRaw = localStorage.getItem('school:students')
        setStudents(sRaw ? JSON.parse(sRaw) : [])
      })
    } catch { setStudents([]) }
  }, [])

  // Keep section picks in sync when class changes
  React.useEffect(() => {
    setNSection(prev => {
      const arr = getSectionsForClass(nKlass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [nKlass])

  // (Assignments removed)

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => setPhotoDraft(String(r.result))
    r.readAsDataURL(file)
  }

  const saveProfile = () => {
    try {
      const a = admin
      if (!a) return
      const payload = { user: profileDraftName.trim() || 'HOD', dept: a.dept }
      sessionStorage.setItem('admin', JSON.stringify(payload))
      setAdmin(payload)
      try { localStorage.setItem(`hod:profile:${a.dept}`, JSON.stringify({ name: payload.user, password: profileDraftPassword.trim() || '' })) } catch {}
      if (photoDraft) { try { localStorage.setItem(`hod:photo:${a.dept}`, photoDraft) } catch {} setPhoto(photoDraft); setPhotoDraft(null) }
      setProfileDraftPassword('')
      setProfileMessage('Profile updated successfully.')
    } catch { setProfileMessage('Could not update profile') }
  }

  const onAddEvent = () => {
    if (!admin) return
    if (!calTitle.trim()) return
    const payload: any = { date: calDate, title: calTitle.trim(), tag: calTag.trim() || 'EVENT', color: calColor, description: calDesc.trim(), createdBy: admin.user }
    if (calScopeClass) { payload.klass = calScopeClass; if (calScopeSection) payload.section = calScopeSection }
    addCalendarEvent(payload)
    setCalTitle(''); setCalDesc('')
    // refresh current month list using same helper as teacher calendar
    refreshMonthEvents()
  }

  // Persist staff list
  const saveStaff = (next: Staff[]) => {
    setStaff(next)
    try { localStorage.setItem('school:teachers', JSON.stringify(next)) } catch {}
    try { window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:teachers' } })) } catch {}
  }

  // Persist students
  const saveStudents = (next: Student[]) => {
    setStudents(next)
    try { localStorage.setItem('school:students', JSON.stringify(next)) } catch {}
    try { window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:students' } })) } catch {}
  }
  const saveAssign = (next: TeachingAssignment[]) => { setAssigns(next); try { saveAssignments(next) } catch {} }

  // (Assignments removed)

  // Live refresh for admin data changes across tabs (staff/students)
  React.useEffect(() => {
    const refreshStaff = () => { try { const tRaw = localStorage.getItem('school:teachers'); setStaff(tRaw ? JSON.parse(tRaw) : []) } catch { setStaff([]) } }
    const refreshStudents = () => { try { const sRaw = localStorage.getItem('school:students'); setStudents(sRaw ? JSON.parse(sRaw) : []) } catch { setStudents([]) } }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:teachers') refreshStaff()
      if (e.key === 'school:students') refreshStudents()
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key) { refreshStaff(); refreshStudents(); return }
        if (key === 'school:teachers') refreshStaff()
        if (key === 'school:students') refreshStudents()
      } catch { refreshStaff(); refreshStudents() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [])

  const resetAll = () => {
    const desired = 'v4-empty-initial'
    try {
      const toEmptyArray = ['school:teachers','school:students','school:subjects','school:circulars','school:marks','school:assignments','school:syllabus','school:textbooks']
      const toEmptyObject = ['school:attendance','school:diary','school:calendar','school:classSections','school:classHours','school:classSubjects','school:materials','school:pyqs']
      const toEmptyStringArray = ['school:classes','school:sections']
      // Clear profiles/photos by prefix
      const prefixes = ['student:profile:','student:photo:','teacher:profile:','teacher:photo:','parent:profile:','parent:photo:','hod:profile:','hod:photo:']
      for (let i=0; i<localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k) continue
        if (prefixes.some(p => k.startsWith(p))) { try { localStorage.removeItem(k) } catch {} }
      }
      toEmptyArray.forEach(k => { try { localStorage.setItem(k, JSON.stringify([])) } catch {} })
      toEmptyObject.forEach(k => { try { localStorage.setItem(k, JSON.stringify({})) } catch {} })
      toEmptyStringArray.forEach(k => { try { localStorage.setItem(k, JSON.stringify([])) } catch {} })
      // Broadcast updates to all pages
      const keys = [...toEmptyArray, ...toEmptyObject, ...toEmptyStringArray]
      keys.forEach(k => { try { window.dispatchEvent(new CustomEvent('school:update', { detail: { key: k } })) } catch {} })
      // Prevent reseed of defaults
      localStorage.setItem('school:seed:version', desired)
      setStaff([]); setStudents([]); setAssigns([])
      setResetMsg('All data cleared. You can now add fresh data from HOD.')
      setTimeout(()=> setResetMsg(''), 2500)
    } catch {
      setResetMsg('Failed to clear data. Try again.')
      setTimeout(()=> setResetMsg(''), 2000)
    }
  }

  // Performance calculations from school:marks
  type MarkSheet = { test: string; subject: string; klass: string; section: 'A'|'B'; date?: string; max: number; marks: Record<string, number> }
  function readMarks(): MarkSheet[] { try { const raw = localStorage.getItem('school:marks'); return raw ? JSON.parse(raw) : [] } catch { return [] } }

  const [marksVersion, setMarksVersion] = React.useState(0)

  React.useEffect(() => {
    const bump = () => setMarksVersion(v => v + 1)
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:marks') bump() }
    const onBus = (e: Event) => { try { const k = (e as CustomEvent).detail?.key; if (!k || k === 'school:marks') bump() } catch { bump() } }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [])

  const classPerf = React.useMemo(() => {
    const arr = readMarks()
    const key = (k: string, s: string) => `${k}|${s}`
    const map: Record<string, { sum: number; total: number }> = {}
    for (const m of arr) {
      const k = key(m.klass, m.section)
      if (!map[k]) map[k] = { sum: 0, total: 0 }
      for (const usn of Object.keys(m.marks || {})) {
        map[k].sum += Number((m.marks as any)[usn] || 0)
        map[k].total += m.max || 0
      }
    }
    const out: Array<{ klass: string; section: 'A'|'B'; pct: number }> = []
    for (const k of Object.keys(map)) {
      const [klass, section] = k.split('|')
      const { sum, total } = map[k]
      out.push({ klass, section: section as any, pct: total ? Math.round((sum * 100) / total) : 0 })
    }
    // sort high to low
    out.sort((a,b) => b.pct - a.pct)
    return out
  }, [tab, marksVersion])

  const teacherPerf = React.useMemo(() => {
    const arr = readMarks()
    const map: Record<string, { sum: number; total: number }> = {}
    for (const m of arr) {
      const subj = m.subject
      if (!map[subj]) map[subj] = { sum: 0, total: 0 }
      for (const usn of Object.keys(m.marks || {})) {
        map[subj].sum += Number((m.marks as any)[usn] || 0)
        map[subj].total += m.max || 0
      }
    }
    const out: Array<{ subject: string; teacher?: string; pct: number }> = []
    for (const subj of Object.keys(map)) {
      const { sum, total } = map[subj]
      const t = staff.find(x => {
        const sub = (x as any).subject
        const subs = (x as any).subjects as string[] | undefined
        if (Array.isArray(subs)) return subs.some(s => s.toLowerCase() === subj.toLowerCase())
        if (typeof sub === 'string') return sub.toLowerCase() === subj.toLowerCase()
        return false
      })
      out.push({ subject: subj, teacher: t?.name, pct: total ? Math.round((sum * 100) / total) : 0 })
    }
    out.sort((a,b) => b.pct - a.pct)
    return out
  }, [staff, tab, marksVersion])

  // Performance filters (HOD analysis)
  const [pfClass, setPfClass] = React.useState<string>(() => getClasses()[0] || '')
  const [pfSection, setPfSection] = React.useState<string>(() => (getSectionsForClass((getClasses()[0]||''))[0] || ''))
  React.useEffect(() => { setPfSection(prev => { const arr = getSectionsForClass(pfClass); return arr.includes(prev) ? prev : (arr[0] || '') }) }, [pfClass])

  const pfSubjects = React.useMemo(() => {
    const list = getClassSubjects(pfClass, pfSection)
    return (list && list.length ? list : getSubjects())
  }, [pfClass, pfSection, marksVersion])

  const pfTests = React.useMemo(() => listTestsForClass(pfClass, pfSection), [pfClass, pfSection, marksVersion])
  const [pfTeacher, setPfTeacher] = React.useState<string>('')
  const pfTeacherOptions = React.useMemo(() => {
    // Prefer explicit assignments; fallback to staff subject mapping
    const assignedTeachers = Array.from(new Set(
      assigns
        .filter(a => a.klass === pfClass && a.section === pfSection)
        .map(a => a.teacher)
    ))
    if (assignedTeachers.length) return assignedTeachers
    // Fallback: teachers who have any of the subjects in this class/section
    const set = new Set<string>()
    for (const t of staff) {
      const subs: string[] = Array.isArray((t as any).subjects) ? (t as any).subjects as string[] : ((t as any).subject ? [(t as any).subject as string] : [])
      if (subs.some(s => pfSubjects.map(x => x.toLowerCase()).includes(s.toLowerCase()))) set.add(t.name)
    }
    return Array.from(set)
  }, [assigns, staff, pfClass, pfSection, pfSubjects])
  React.useEffect(() => {
    setPfTeacher(prev => prev && pfTeacherOptions.includes(prev) ? prev : (pfTeacherOptions[0] || ''))
  }, [pfTeacherOptions])

  // Class averages by test (overall %) for latest two tests
  const pfClassOverall = React.useMemo(() => {
    const tests2 = pfTests.slice(0, 2)
    const values: number[] = []
    const details: Array<{ sum:number; total:number }> = []
    for (const t of tests2) {
      const totals = readTotalsByTest(pfClass, pfSection as any, t)
      const sum = totals.reduce((s, tt) => s + tt.sum, 0)
      const total = totals.reduce((s, tt) => s + tt.total, 0)
      values.push(total ? Math.round((sum * 100) / total) : 0)
      details.push({ sum, total })
    }
    return { tests: tests2, values, details }
  }, [pfClass, pfSection, pfTests, marksVersion])

  // Build grouped bar data: categories=subjects, series=tests
  const pfSeries: Array<LineSeries> = React.useMemo(() => {
    const palette = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
    return pfTests.map((t, idx) => {
      const avgs = subjectAveragesForTest(pfClass, pfSection, t)
      const map = new Map(avgs.map(x => [x.subject.toLowerCase(), x.pct]))
      const data = pfSubjects.map(sub => map.get(sub.toLowerCase()) ?? null)
      return { name: t, color: palette[idx % palette.length], data } as BarSeries
    })
  }, [pfClass, pfSection, pfTests, pfSubjects, marksVersion])

  // Subject labels with teacher name
  const pfSubjectLabels = React.useMemo(() => {
    return pfSubjects.map(sub => {
      let teacher: string | undefined = assigns.find(a => a.klass === pfClass && a.section === pfSection && a.subject === sub)?.teacher
      if (!teacher) {
        const t = staff.find(x => {
          const subs = (x as any).subjects as string[] | undefined
          if (Array.isArray(subs)) return subs.some(s => s.toLowerCase() === sub.toLowerCase())
          const s = (x as any).subject as string | undefined
          return typeof s === 'string' && s.toLowerCase() === sub.toLowerCase()
        })
        teacher = t?.name
      }
      return teacher ? `${sub} — ${teacher}` : sub
    })
  }, [pfSubjects, assigns, staff, pfClass, pfSection])

  // HOD: Teacher performance for selected class/section (overall across all tests)
  const pfTeacherPerf = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('school:marks')
      const arr: Array<{ test:string; subject:string; klass:string; section:string; max:number; marks:Record<string,number> }> = raw ? JSON.parse(raw) : []
      const filtered = arr.filter(m => m.klass === pfClass && String(m.section||'').toUpperCase() === String(pfSection||'').toUpperCase())
      const map: Record<string, { sum:number; total:number }> = {}
      for (const m of filtered) {
        const subj = String(m.subject||'')
        if (!map[subj]) map[subj] = { sum: 0, total: 0 }
        const values = Object.values(m.marks || {}) as number[]
        map[subj].sum += values.reduce((s,n)=> s + (Number(n)||0), 0)
        map[subj].total += (m.max || 0) * values.length
      }
      const out: Array<{ subject:string; teacher?:string; pct:number; sum:number; total:number; tests:number }> = []
      for (const subject of Object.keys(map)) {
        const { sum, total } = map[subject]
        // Resolve teacher via assignment first, else by staff subject mapping
        let teacher: string | undefined = assigns.find(a => a.klass === pfClass && a.section === pfSection && a.subject === subject)?.teacher
        if (!teacher) {
          const t = staff.find(x => {
            const subs = (x as any).subjects as string[] | undefined
            if (Array.isArray(subs)) return subs.some(s => s.toLowerCase() === subject.toLowerCase())
            const sub = (x as any).subject as string | undefined
            return typeof sub === 'string' && sub.toLowerCase() === subject.toLowerCase()
          })
          teacher = t?.name
        }
        const tests = new Set(filtered.filter(m => String(m.subject||'').toLowerCase() === subject.toLowerCase()).map(m => m.test)).size
        out.push({ subject, teacher, pct: total ? Math.round((sum*100)/total) : 0, sum, total, tests })
      }
      out.sort((a,b) => b.pct - a.pct)
      return out
    } catch { return [] }
  }, [assigns, staff, pfClass, pfSection, marksVersion])

  // Selected teacher details: subjects taught in this class/section
  const pfTeacherSubjects = React.useMemo(() => {
    if (!pfTeacher) return []
    const subjects = new Set<string>()
    // Use assignments if present
    assigns
      .filter(a => a.klass === pfClass && a.section === pfSection && a.teacher === pfTeacher)
      .forEach(a => subjects.add(a.subject))
    // Fallback to staff mapping intersected with pfSubjects
    if (subjects.size === 0) {
      const t = staff.find(x => x.name === pfTeacher)
      if (t) {
        const subs: string[] = Array.isArray((t as any).subjects) ? (t as any).subjects as string[] : ((t as any).subject ? [(t as any).subject as string] : [])
        for (const s of subs) { if (pfSubjects.map(x=>x.toLowerCase()).includes(s.toLowerCase())) subjects.add(s) }
      }
    }
    return Array.from(subjects)
  }, [pfTeacher, assigns, staff, pfClass, pfSection, pfSubjects])
  const pfTeacherSeries: BarSeries[] = React.useMemo(() => {
    const palette = ['#0ea5e9', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b']
    return pfTeacherSubjects.map((subj, idx) => ({
      name: subj,
      color: palette[idx % palette.length],
      data: pfTests.map(test => {
        const avgs = subjectAveragesForTest(pfClass, pfSection, test)
        const found = avgs.find(x => x.subject.toLowerCase() === subj.toLowerCase())
        return found ? found.pct : null
      })
    }))
  }, [pfTeacherSubjects, pfTests, pfClass, pfSection, marksVersion])
  const pfTeacherOverallSeries: BarSeries[] = React.useMemo(() => [
    {
      name: 'Teacher overall %',
      color: '#334155',
      data: pfTests.map(test => {
        const avgs = subjectAveragesForTest(pfClass, pfSection, test)
        const vals = avgs.filter(x => pfTeacherSubjects.map(s=>s.toLowerCase()).includes(x.subject.toLowerCase())).map(x=>x.pct)
        if (!vals.length) return null
        return Math.round(vals.reduce((a,b)=>a+b,0) / vals.length)
      })
    }
  ], [pfTeacherSubjects, pfTests, pfClass, pfSection, marksVersion])

  // Calendar recompute when month changes
  const refreshMonthEvents = React.useCallback(() => {
    try {
      const ym = ymOf(month)
      const items = readCalendarByMonth(ym, calScopeClass || undefined, calScopeSection || undefined) as any
      setEventsThisMonth(Array.isArray(items) ? items : [])
    } catch {
      setEventsThisMonth([])
    }
  }, [month, calScopeClass, calScopeSection])

  React.useEffect(() => { refreshMonthEvents() }, [refreshMonthEvents])

  if (!mounted) {
    return (
      <div>
        <div className="topbar">
          <div className="topbar-inner">
            <div className="brand-mark"><span className="dot" /><strong>HOD</strong></div>
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
          <div className="brand-mark"><span className="dot" /><strong>HOD</strong></div>
          <nav className="tabs" aria-label="HOD navigation">
            {tabs.map(t => (
              <button key={t} className={`tab ${tab === t ? 'tab-active' : ''}`} onClick={()=>setTab(t as Tab)}>{t}</button>
            ))}
          </nav>
          <div className="actions" style={{ position:'relative' }}>
            <button className="btn-ghost" onClick={toggle}>{theme === 'light' ? 'Dark' : 'Light'} Mode</button>
            {photo ? (
              <img ref={avatarRef as React.MutableRefObject<HTMLImageElement | null>} src={photoDraft ?? photo} alt="Profile" className="avatar" onClick={()=>setMenuOpen(o=>!o)} />
            ) : (
              <div ref={avatarRef as React.RefObject<HTMLDivElement>} className="avatar" title="Set profile photo" onClick={()=>setMenuOpen(o=>!o)} />
            )}
            {menuOpen && (
              <div ref={menuRef} className="menu" role="dialog" aria-label="Profile settings">
                <div className="menu-title">Profile Settings</div>
                <div className="field"><label className="label">Name</label><input className="input" value={profileDraftName} onChange={e=>setProfileDraftName(e.target.value)} /></div>
                <div className="field"><label className="label">Department</label><input className="input" value={admin?.dept || ''} readOnly /></div>
                <div className="field"><label className="label">Reset Password</label><input className="input" type="password" value={profileDraftPassword} onChange={e=>setProfileDraftPassword(e.target.value)} /></div>
                <div className="field"><label className="label">Profile Photo</label><input className="input" type="file" accept="image/*" onChange={e=>onPhotoChange(e.target.files?.[0])} />{photoDraft && <div className="profile-preview">Preview ready. Save to keep changes.</div>}</div>
                {profileMessage && <div className="profile-message">{profileMessage}</div>}
                <div className="actions"><button className="btn" type="button" onClick={saveProfile}>Save changes</button><button className="btn-ghost" type="button" onClick={()=>{setMenuOpen(false); setPhotoDraft(null); setProfileDraftPassword(''); setProfileMessage('')}}>Close</button></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-wrap">
        {tab === 'Overview' && (
          <div className="dash">
            <h2 className="title">Department Overview</h2>
            <p className="subtitle">Quick stats and shortcuts.</p>
            <div className="stat-grid">
              <div className="stat-card stat-blue">
                <div className="stat-title">Teachers</div>
                <div className="stat-value">{staff.length}</div>
                <div className="stat-sub">Active faculty</div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-title">Students</div>
                <div className="stat-value">{students.length}</div>
                <div className="stat-sub">Across all classes</div>
              </div>
              <div className="stat-card stat-violet">
                <div className="stat-title">Classes</div>
                <div className="stat-value">{getClasses().length}</div>
                <div className="stat-sub">Grade groups</div>
              </div>
            </div>
            <div className="chart-card" style={{marginTop:12}}>
              <div className="chart-title">Subjects by Class / Section</div>
              <div className="chart-grid">
                {getClasses().map((c,i) => (
                  <div key={i} style={{display:'grid', gap:8}}>
                    {(getSectionsForClass(c) || []).map((s,j) => (
                      <div key={`${c}-${s}-${j}`} style={{display:'grid', gap:6}}>
                        <div style={{fontWeight:800}}>{c} / {s}</div>
                        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                          {getClassSubjects(c, s).map((sub,k) => {
                            const color = subjectColor(sub) as ColorTag
                            return (<span key={k} className={`chip-pill chip-${color}`}>{sub}</span>)
                          })}
                          {getClassSubjects(c, s).length === 0 && <span className="note">No subjects configured</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Calendar' && (
          <div className="dash">
            <h2 className="title">Academic Calendar</h2>
            <p className="subtitle">Add events visible to staff, students, and parents.</p>
            <div className="chart-card" style={{display:'grid', gap:10, marginTop:12}}>
              <div className="row">
                <input className="input" type="date" value={calDate} onChange={e=>setCalDate(e.target.value)} />
                <select className="input select" value={calColor} onChange={e=>setCalColor(e.target.value as any)}>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                  <option value="pink">Pink</option>
                  <option value="violet">Violet</option>
                </select>
                <input className="input" value={calTag} onChange={e=>setCalTag(e.target.value)} placeholder="Tag e.g. EXAM" />
              </div>
              <input className="input" value={calTitle} onChange={e=>setCalTitle(e.target.value)} placeholder="Event title" />
              <textarea className="paper" style={{minHeight:100}} value={calDesc} onChange={e=>setCalDesc(e.target.value)} placeholder="Description (optional)" />
              <div className="actions"><button className="btn" type="button" onClick={onAddEvent}>Add Event</button></div>
            </div>

            <div className="grid" style={{marginTop:18}}>
              <section className="cal" aria-label="Academic calendar">
                <div className="cal-head">
                  <button className="btn-ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>Prev</button>
                  <div className="cal-title">{monthStr}</div>
                  <button className="btn-ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>Next</button>
                  <div style={{display:'flex', gap:6, marginLeft:12, alignItems:'center'}}>
                    <select
                      className="input select"
                      value={calScopeClass}
                      onChange={e => { setCalScopeClass(e.target.value); setCalScopeSection('') }}
                      style={{minWidth:120}}
                    >
                      <option value="">Whole School</option>
                      {getClasses().map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    <select
                      className="input select"
                      value={calScopeSection}
                      onChange={e => setCalScopeSection(e.target.value)}
                      disabled={!calScopeClass}
                      style={{minWidth:110}}
                    >
                      <option value="">All Sections</option>
                      {(calScopeClass ? getSectionsForClass(calScopeClass) : []).map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={refreshMonthEvents}
                      title="Fetch events for selected class/section"
                    >
                      Get
                    </button>
                  </div>
                </div>
                <div className="cal-grid">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="cal-dow">{d}</div>
                  ))}
                  {getMonthMatrix(month).map((d, index) => {
                    const ymd = formatYMD(d)
                    const dots = (eventsThisMonth || []).filter(e => e.date === ymd)
                    const primaryColor = dots[0]?.color
                    return (
                      <div key={index} className={`cal-day ${d.getMonth() === month.getMonth() ? '' : 'cal-out'} ${isToday(d) ? 'cal-today' : ''} ${dots.length ? 'cal-has-event' : ''}`} data-eventcolor={primaryColor || undefined}>
                        <div className="cal-num">{d.getDate()}</div>
                        <div className="event-dots">
                          {dots.map((e, i) => (
                            <span key={i} className={`event-dot dot-${e.color || 'blue'}`}></span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="cal-mini">Bright highlights mark important days. See more details on the right.</div>
              </section>

              <aside className="events">
                <div className="events-head">Events in {MONTHS[month.getMonth()]}</div>
                <div className="note-list">
                  {eventsThisMonth.length === 0 && <div className="note-card note-blue">No events saved for this month.</div>}
                  {eventsThisMonth.map((e, idx) => (
                    <div key={idx} className={`note-card note-${e.color || 'blue'}`}>
                      <div className="note-chip">{e.tag}</div>
                      <div className="note-title">{e.title}</div>
                      <small>{formatDMYFromYMD(e.date)}</small>
                      {e.description && <p>{e.description}</p>}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        )}

        {tab === 'Setup' && (
          <div className="dash">
            <h2 className="title">Setup</h2>
            <p className="subtitle">Manage subjects, classes, and sections.</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12}}>
              <div className="chart-card">
                <div className="chart-title">Subjects by Class/Section</div>
                <div className="row">
                  <select className="input select" value={subKlass} onChange={e=>setSubKlass(e.target.value)}>{getClasses().map(c=> <option key={c}>{c}</option>)}</select>
                  <select className="input select" value={subSection} onChange={e=>setSubSection(e.target.value)}>{getSectionsForClass(subKlass).map(s=> <option key={s}>{s}</option>)}</select>
                </div>
                <div className="row" style={{marginTop:8}}>
                  <input className="input" placeholder="e.g. Biology" value={newSubj} onChange={e=>setNewSubj(e.target.value)} />
                  <button className="btn-ghost" onClick={()=>{ const n=newSubj.trim(); if(!n) return; addSubjectToClassSection(subKlass, subSection, n); setNewSubj('') }}>Add</button>
                </div>
                <div style={{display:'grid', gap:6, marginTop:10}}>
                  {getClassSubjects(subKlass, subSection).map((s,i)=> (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                      <div style={{fontWeight:700}}>{s}</div>
                      <button className="btn-ghost" onClick={()=> removeSubjectFromClassSection(subKlass, subSection, s)}>Remove</button>
                    </div>
                  ))}
                  {getClassSubjects(subKlass, subSection).length === 0 && <div className="note">No subjects yet for {subKlass} / {subSection}.</div>}
                </div>
              </div>
              <ClassesManager />
              <ClassSectionsManager />
              <ClassHoursManager />
            </div>
            <div className="chart-card" style={{marginTop:16}}>
              <div className="chart-title">Danger Zone</div>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  const pw = prompt('Enter passcode to reset all data (12345)')
                  if (pw !== '12345') { setResetMsg('Incorrect passcode'); setTimeout(()=> setResetMsg(''), 2000); return }
                  if (confirm('This will remove all teachers, students, subjects, classes, sections, attendance, marks, diary, calendar, circulars, and assignments. Continue?')) {
                    resetAll()
                  }
                }}
              >
                Reset All Data
              </button>
              {resetMsg && <div className="profile-message" style={{marginTop:8}}>{resetMsg}</div>}
            </div>
          </div>
        )}

        {tab === 'Staff' && (
          <div className="dash">
            <h2 className="title">Staff Management</h2>
            <p className="subtitle">Add new staff and assign subjects/roles.</p>
            <div className="chart-card" style={{marginTop:12}}>
              <div className="chart-title">Add Staff</div>
              <div className="row" style={{marginTop:6}}>
              <input className="input" placeholder="Name" value={sName} onChange={e=>setSName(e.target.value)} />
              <div className="input" style={{padding: 10}}>
                <div className="note" style={{marginBottom:6}}>Subjects</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                  {(function(){
                    const set = new Set<string>()
                    for (const c of getClasses()) {
                      for (const s of getSectionsForClass(c)) {
                        for (const sub of getClassSubjects(c, s)) set.add(sub)
                      }
                    }
                    const list = Array.from(set)
                    return list.map(sub => {
                      const checked = sSubjects.includes(sub)
                      return (
                        <label key={sub} style={{display:'inline-flex', alignItems:'center', gap:6, border:'1px solid var(--panel-border)', borderRadius:8, padding:'4px 8px'}}>
                          <input type="checkbox" checked={checked} onChange={(e)=>{
                            setSSubjects(prev => e.target.checked ? Array.from(new Set([...prev, sub])) : prev.filter(x=>x!==sub))
                          }} />
                          <span>{sub}</span>
                        </label>
                      )
                    })
                  })()}
                </div>
                {(() => {
                  const hasAny = (() => { for (const c of getClasses()) { for (const s of getSectionsForClass(c)) { if (getClassSubjects(c, s).length) return true } } return false })()
                  return hasAny ? null : <div className="note" style={{marginTop:6}}>No subjects configured yet. Add them in Setup → Subjects by Class/Section.</div>
                })()}
              </div>
              <select className="input select" value={sRole} onChange={e=>setSRole(e.target.value)}>
                {['Teacher','HOD','Assistant'].map(r=> <option key={r}>{r}</option>)}
              </select>
              <button className="btn-ghost" type="button" onClick={()=>{
                const name = sName.trim(); const subs = sSubjects.filter(Boolean);
                if (!name || subs.length===0) return;
                const next = [...staff, { name, subjects: subs, role: sRole } as Staff];
                saveStaff(next); setSName(''); setSSubjects([])
              }}>Add Staff</button>
              </div>
            </div>
            <div className="chart-card" style={{display:'grid', gap:8, marginTop:12}}>
              <div className="chart-title">Staff List</div>
              {staff.map((t,i)=> (
                <div key={i} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'8px 10px'}}>
                  <div style={{fontWeight:700}}>{t.name}</div>
                  <div>{Array.isArray((t as any).subjects) ? (t as any).subjects.join(', ') : (t as any).subject}</div>
                  <div className="note">{t.role}</div>
                  <button className="btn-ghost" type="button" onClick={()=> saveStaff(staff.filter((_,idx)=> idx!==i))}>Remove</button>
                </div>
              ))}
            </div>
            <div className="chart-card" style={{marginTop:16}}>
              <div className="chart-title">Teaching Assignments</div>
              <div className="row" style={{marginTop:6}}>
                <select className="input select" value={aTeacher} onChange={e=>setATeacher(e.target.value)}>
                  <option value="">Select Teacher</option>
                  {staff.map(s=> <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <select className="input select" value={aSubject} onChange={e=>setASubject(e.target.value)}>
                  <option value="">Subject</option>
                  {(function(){
                    const t = staff.find(x => x.name === aTeacher)
                    let subs: string[] = []
                    if (t && Array.isArray((t as any).subjects)) subs = (t as any).subjects as string[]
                    else if (t?.subject) subs = [t.subject]
                    if (subs.length === 0) {
                      const set = new Set<string>()
                      for (const c of getClasses()) { for (const s of getSectionsForClass(c)) { for (const sub of getClassSubjects(c, s)) set.add(sub) } }
                      subs = Array.from(set)
                    }
                    return subs.map(s => <option key={s} value={s}>{s}</option>)
                  })()}
                </select>
                <select className="input select" value={aClass} onChange={e=>{ setAClass(e.target.value); setASection('') }}>
                  <option value="">Select Class</option>
                  {getClasses().map(c=> <option key={c}>{c}</option>)}
                </select>
                <select className="input select" value={aSection} onChange={e=>setASection(e.target.value)}>
                  <option value="">Section</option>
                  {aClass && getSectionsForClass(aClass).map(s=> <option key={s}>{s}</option>)}
                </select>
                <button className="btn-ghost" type="button" onClick={()=>{
                  if (!aTeacher || !aClass || !aSection || !aSubject) return
                  const next = [...assigns, { teacher: aTeacher, subject: aSubject, klass: aClass, section: aSection }]
                  saveAssign(next)
                }}>Assign</button>
              </div>
              <div style={{display:'grid', gap:6, marginTop:10}}>
                {assigns.map((a,i)=> (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                    <div style={{fontWeight:700}}>{a.teacher}</div>
                    <div>{a.klass} / {a.section}</div>
                    <div className="note">{a.subject}</div>
                    <button className="btn-ghost" onClick={()=> saveAssign(assigns.filter((_,idx)=> idx!==i))}>Remove</button>
                  </div>
                ))}
                {assigns.length === 0 && <div className="note">No assignments yet.</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'Students' && (
          <div className="dash">
            <h2 className="title">Students</h2>
            <p className="subtitle">Admitted students appear automatically after parents submit applications. Assign roll numbers and sections here. Changes reflect immediately.</p>

            <StudentsManager />
          </div>
        )}

        {tab === 'Performance' && (
          <div className="dash">
            <h2 className="title">Performance Analytics</h2>
            <p className="subtitle">Compare all conducted tests, see pass trends by class/section, and drill into detailed teacher performance.</p>
            <div className="chart-card" style={{marginTop:12}}>
              <PerformancePassPanel
                staff={staff}
                assigns={assigns}
              />
            </div>
          </div>
        )}

        {tab === 'Students Portal' && (
          <div className="dash">
            <h2 className="title">Students Portal (Embedded)</h2>
            <p className="subtitle">The full students site, shown inside SAS for quick access.</p>
            <div className="card" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
              <iframe
                src="http://localhost:3030/"
                title="Students Portal"
                style={{ width: '100%', height: '600px', border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Calendar helpers (mirror student calendar)
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
function getMonthMatrix(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // Monday start
  const days: Date[] = []
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
  return days
}
function formatYMD(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function formatDMYFromYMD(ymd: string) {
  const y = ymd.slice(0,4), m = ymd.slice(5,7), d = ymd.slice(8,10)
  return `${d}/${m}/${y}`
}
function ymOf(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}
function isToday(d: Date) {
  const t = new Date(); return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate()
}

function ClassSectionsManager() {
  const [klass, setKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [secName, setSecName] = React.useState('')
  const [bulk, setBulk] = React.useState('')
  const [sections, setSections] = React.useState<string[]>(() => getSectionsForClass(klass))
  React.useEffect(() => { setSections(getSectionsForClass(klass)) }, [klass])

  const refresh = () => setSections(getSectionsForClass(klass))

  const addOne = () => { const n = secName.trim().toUpperCase(); if (!n) return; addSectionToClass(klass, n); setSecName(''); refresh() }
  const addBulk = () => {
    const parts = bulk.split(',').map(s=>s.trim()).filter(Boolean)
    if (!parts.length) return
    for (const p of parts) addSectionToClass(klass, p.toUpperCase())
    setBulk(''); refresh()
  }
  return (
    <div className="chart-card">
      <div className="chart-title">Sections (per class)</div>
      <div className="row" style={{marginBottom:8}}>
        <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>{getClasses().map(c=> <option key={c}>{c}</option>)}</select>
      </div>
      <div className="row">
        <input className="input" placeholder="Section name e.g. C" value={secName} onChange={e=>setSecName(e.target.value)} />
        <button className="btn-ghost" onClick={addOne}>Add</button>
      </div>
      <div className="row" style={{marginTop:8}}>
        <input className="input" placeholder="Add multiple (comma separated) e.g. D, E" value={bulk} onChange={e=>setBulk(e.target.value)} />
        <button className="btn-ghost" onClick={addBulk}>Add All</button>
      </div>
      <div style={{display:'grid', gap:6, marginTop:8}}>
        {sections.map((s,i)=> (
          <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
            <div style={{fontWeight:700}}>{klass} — Section {s}</div>
            <button className="btn-ghost" onClick={()=> { removeSectionFromClass(klass, s); refresh() }}>Remove</button>
          </div>
        ))}
        {sections.length === 0 && <div className="note">No sections yet for {klass}.</div>}
      </div>
    </div>
  )
}

function ClassesManager() {
  const [val, setVal] = React.useState('')
  const [secCount, setSecCount] = React.useState<number>(0)
  const [list, setList] = React.useState<string[]>(() => getClasses())
  const refresh = () => setList(getClasses())
  const add = () => {
    const n = val.trim(); if (!n) return; addClass(n);
    // Auto create sections if requested: A, B, C, ...
    const count = Math.max(0, Number(secCount) || 0)
    for (let i=0;i<count;i++) {
      const name = String.fromCharCode('A'.charCodeAt(0) + i)
      addSectionToClass(n, name)
    }
    setVal(''); setSecCount(0); refresh()
  }
  return (
    <div className="chart-card">
      <div className="chart-title">Classes</div>
      <div className="row">
        <input className="input" placeholder="e.g. Class 6" value={val} onChange={e=>setVal(e.target.value)} />
        <input className="input" type="number" min={0} placeholder="# Sections" value={secCount || ''} onChange={e=> setSecCount(Number(e.target.value))} />
        <button className="btn-ghost" onClick={add}>Add</button>
      </div>
      <div style={{display:'grid', gap:6, marginTop:8}}>
        {list.map((c,i)=> (
          <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
            <div style={{fontWeight:700}}>{c}</div>
            <button className="btn-ghost" onClick={()=> { removeClass(c); refresh() }}>Delete</button>
          </div>
        ))}
        {list.length === 0 && <div className="note">No classes yet.</div>}
      </div>
    </div>
  )
}

function ClassHoursManager() {
  const [klass, setKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [val, setVal] = React.useState<number>(() => (klass ? getHoursForClass(klass) : 5))
  const [message, setMessage] = React.useState('')
  React.useEffect(() => { setVal(klass ? getHoursForClass(klass) : 5) }, [klass])

  const save = () => {
    const n = Math.min(12, Math.max(1, Math.floor(Number(val) || 0)))
    if (!klass) return
    setHoursForClass(klass, n)
    setVal(n)
    setMessage(`Saved: ${klass} has ${n} hours`)
    setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div className="chart-card">
      <div className="chart-title">Class Hours (periods per day)</div>
      <div className="row">
        <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>
          {getClasses().map(c=> <option key={c}>{c}</option>)}
        </select>
        <input className="input" type="number" min={1} max={12} value={val} onChange={e=> setVal(Number(e.target.value))} />
        <button className="btn-ghost" onClick={save}>Save</button>
      </div>
      <div className="note" style={{marginTop:8}}>Default for new classes: 5 hours (unless changed here).</div>
      {message && <div className="profile-message" style={{marginTop:8}}>{message}</div>}
    </div>
  )
}

function PerformancePassPanel(props: { staff: Staff[]; assigns: TeachingAssignment[] }) {
  const { staff, assigns } = props
  const [klass, setKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [section, setSection] = React.useState<string>(() => (getSectionsForClass((getClasses()[0]||''))[0] || ''))
  React.useEffect(() => { setSection(prev => { const arr = getSectionsForClass(klass); return arr.includes(prev) ? prev : (arr[0] || '') }) }, [klass])
  const [teacher, setTeacher] = React.useState<string>('')
  const [showTeacher, setShowTeacher] = React.useState(false)
  const [version, setVersion] = React.useState(0) // bump on click

  const teacherOptions = React.useMemo(() => {
    const assigned = Array.from(new Set(assigns.filter(a => a.klass === klass && a.section === section).map(a => a.teacher)))
    if (assigned.length) return assigned
    const set = new Set<string>()
    for (const t of staff) {
      const subs: string[] = Array.isArray((t as any).subjects) ? (t as any).subjects as string[] : ((t as any).subject ? [(t as any).subject as string] : [])
      if (subs.length) set.add(t.name)
    }
    return Array.from(set)
  }, [assigns, staff, klass, section])
  React.useEffect(() => { setTeacher(prev => prev && teacherOptions.includes(prev) ? prev : (teacherOptions[0] || '')) }, [teacherOptions])

  // Helper: read all marks
  const readAllMarks = React.useCallback(() => {
    try {
      const raw = localStorage.getItem('school:marks')
      const arr: Array<{ test:string; subject:string; klass:string; section:string; max:number; marks:Record<string, number> }> = raw ? JSON.parse(raw) : []
      return arr
    } catch { return [] }
  }, [])

  // Class-level per-test statistics across all subjects
  const classPerTest = React.useMemo(() => {
    if (!klass || !section) return []
    const roster = rosterBy(klass, section)
    const tests = listTestsForClass(klass, section as any)
    const all = readAllMarks()
    const out: Array<{ test:string; appeared:number; passed:number; failed:number; passPct:number }> = []
    for (const t of tests) {
      const sheets = all.filter(m => m.klass === klass && String(m.section||'').toUpperCase() === String(section||'').toUpperCase() && String(m.test||'').toLowerCase() === String(t||'').toLowerCase())
      let appeared = 0, passed = 0
      for (const ms of sheets) {
        const entries = Object.values(ms.marks || {}) as number[]
        const max = Number(ms.max || 0)
        const threshold = Math.round(max * 0.35)
        appeared += entries.length
        for (const v of entries) if (Number(v||0) >= threshold) passed += 1
      }
      const failed = Math.max(0, appeared - passed)
      const passPct = appeared ? Math.round((passed * 100) / appeared) : 0
      out.push({ test: t, appeared, passed, failed, passPct })
    }
    return out
  }, [klass, section, version, readAllMarks])

  // Teacher per-test statistics across that teacher's subjects in the class/section
  const teacherPerTest = React.useMemo(() => {
    if (!klass || !section || !teacher) return []
    // Resolve teacher subjects for this class/section
    const subjects = (() => {
      const assigned = assigns.filter(a => a.klass === klass && a.section === section && a.teacher === teacher).map(a => a.subject)
      if (assigned.length) return assigned
      const t = staff.find(x => x.name === teacher)
      const subs: string[] = t ? (Array.isArray((t as any).subjects) ? (t as any).subjects as string[] : ((t as any).subject ? [(t as any).subject as string] : [])) : []
      const classSubs = getClassSubjects(klass, section)
      const set = new Set(classSubs.map(s => s.toLowerCase()))
      return subs.filter(s => set.has(s.toLowerCase()))
    })()
    if (subjects.length === 0) return []
    const tests = listTestsForClass(klass, section as any)
    const all = readAllMarks()
    const out: Array<{ test:string; appeared:number; passed:number; failed:number; passPct:number }> = []
    for (const t of tests) {
      const sheets = all.filter(m =>
        m.klass === klass &&
        String(m.section||'').toUpperCase() === String(section||'').toUpperCase() &&
        String(m.test||'').toLowerCase() === String(t||'').toLowerCase() &&
        subjects.map(s=>s.toLowerCase()).includes(String(m.subject||'').toLowerCase())
      )
      let appeared = 0, passed = 0
      for (const ms of sheets) {
        const entries = Object.values(ms.marks || {}) as number[]
        const max = Number(ms.max || 0)
        const threshold = Math.round(max * 0.35)
        appeared += entries.length
        for (const v of entries) if (Number(v||0) >= threshold) passed += 1
      }
      const failed = Math.max(0, appeared - passed)
      const passPct = appeared ? Math.round((passed * 100) / appeared) : 0
      out.push({ test: t, appeared, passed, failed, passPct })
    }
    return out
  }, [klass, section, teacher, assigns, staff, version, readAllMarks])

  const teacherTests = React.useMemo(() => classPerTest.map(x => x.test), [classPerTest])
  const [teacherTest, setTeacherTest] = React.useState<string>('')
  React.useEffect(() => {
    setTeacherTest(prev => prev && teacherTests.includes(prev) ? prev : (teacherTests[0] || ''))
  }, [teacherTests, showTeacher])

  const teacherBarSeries: LineSeries[] = React.useMemo(() => [
    { name: 'Pass %', color: '#2563eb', data: teacherPerTest.map(r => r.passPct) }
  ], [teacherPerTest])

  const teacherPieData = React.useMemo(() => {
    const row = teacherPerTest.find(r => r.test === teacherTest)
    const passed = row ? row.passed : 0
    const failed = row ? row.failed : 0
    return [
      { label: 'Passed', value: passed, color: '#10b981' },
      { label: 'Failed', value: failed, color: '#ef4444' },
    ]
  }, [teacherPerTest, teacherTest])

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="row" style={{padding:'0 12px 0'}}>
        <select className="input select" value={klass} onChange={e=> setKlass(e.target.value)}>
          {getClasses().map(c=> <option key={c}>{c}</option>)}
        </select>
        <select className="input select" value={section} onChange={e=> setSection(e.target.value)}>
          {getSectionsForClass(klass).map(s=> <option key={s}>{s}</option>)}
        </select>
        <button className="btn" type="button" onClick={()=> setVersion(v=> v+1)}>Get Performance</button>
        <button className="btn-ghost" type="button" onClick={()=> setShowTeacher(v => !v)}>{showTeacher ? 'Hide' : 'Teacher performance'}</button>
      </div>
      <div className="chart-card" style={{padding:'0 12px 12px'}}>
        <div className="chart-title">Class Performance — {klass} / {section}</div>
        {classPerTest.length === 0 ? (
          <div className="note">No tests found for this class/section.</div>
        ) : (
          <>
            <div className="grid" style={{alignItems:'stretch', marginBottom: 10}}>
              <section className="cal" aria-label="Class pass trend">
                <div style={{padding:12}}>
                  <LineChart
                    title="Pass % by test"
                    categories={classPerTest.map(r=>r.test)}
                    series={[{ name: 'Pass %', color: '#0ea5e9', data: classPerTest.map(r=>r.passPct) }]}
                    yMax={100}
                  />
                </div>
              </section>
              <aside className="events">
                <div className="events-head">Test details</div>
                <div className="note-list">
                  {classPerTest.map((row, idx) => {
                    const prev = idx > 0 ? classPerTest[idx - 1] : null
                    const diff = prev ? row.passPct - prev.passPct : 0
                    const diffLabel = prev ? (diff > 0 ? `▲ +${diff}% vs previous` : diff < 0 ? `▼ ${diff}% vs previous` : 'No change vs previous') : 'First test for this class'
                    return (
                      <div key={row.test} className={`note-card note-${idx%2===0?'green':'blue'}`} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                          <div className="note-chip">{row.test}</div>
                          <div className="note-title">Class Pass: {row.passPct}%</div>
                          <small>Appeared {row.appeared} • Passed {row.passed} • Failed {row.failed}</small>
                        </div>
                        <div className="note" style={{textAlign:'right', minWidth:140}}>{diffLabel}</div>
                      </div>
                    )
                  })}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
      {showTeacher && (
        <div className="chart-card" style={{padding:'0 12px 12px'}}>
          <div className="chart-title">Teacher Performance</div>
          <div className="row" style={{marginBottom:8}}>
            <select className="input select" value={teacher} onChange={e=> setTeacher(e.target.value)}>
              {teacherOptions.length === 0 ? <option value="">No teachers</option> : null}
              {teacherOptions.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input select" value={teacherTest} onChange={e=> setTeacherTest(e.target.value)}>
              {teacherTests.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {!teacher ? (
            <div className="note">Select a teacher to view their performance for this class/section.</div>
          ) : teacherPerTest.length === 0 ? (
            <div className="note">No tests or subjects mapped for this teacher here.</div>
          ) : (
            <>
              <div className="grid" style={{alignItems:'stretch'}}>
                <section className="cal" aria-label="Teacher pass trend">
                  <div style={{padding:12}}>
                    <LineChart title={`Pass % by test — ${teacher}`} categories={teacherPerTest.map(r=>r.test)} series={teacherBarSeries} yMax={100} />
                  </div>
                </section>
                <aside className="events">
                  <div className="events-head">Pass vs Fail — {teacherTest}</div>
                  <div style={{padding:12}}>
                    <PieChart data={teacherPieData} />
                  </div>
                </aside>
              </div>
              <div className="note-list" style={{marginTop:10}}>
                {teacherPerTest.map((row, idx) => {
                  const classRow = classPerTest.find(r => r.test === row.test)
                  const classPct = classRow ? classRow.passPct : null
                  const diff = classPct !== null ? row.passPct - classPct : null
                  const diffText = diff === null ? '—' : diff > 0 ? `+${diff}% vs class` : diff < 0 ? `${diff}% vs class` : 'Same as class'
                  return (
                    <div key={row.test} className={`note-card note-${idx%2===0?'violet':'pink'}`} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div className="note-chip">{row.test}</div>
                        <div className="note-title">Teacher Pass: {row.passPct}%</div>
                        <small>Appeared {row.appeared} • Passed {row.passed} • Failed {row.failed}</small>
                      </div>
                      <div className="note" style={{textAlign:'right', minWidth:160}}>
                        {classPct !== null && <div>Class Pass: {classPct}%</div>}
                        <div>{diffText}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ClassPie({ data }: { data: Array<{ test:string; appeared:number; passed:number; failed:number; passPct:number }> }) {
  const tests = data.map(d => d.test)
  const [t, setT] = React.useState<string>(() => tests[0] || '')
  React.useEffect(() => { setT(prev => prev && tests.includes(prev) ? prev : (tests[0] || '')) }, [tests])
  const row = data.find(d => d.test === t)
  const pie = React.useMemo(() => {
    const passed = row ? row.passed : 0
    const failed = row ? row.failed : 0
    return [
      { label: 'Passed', value: passed, color: '#10b981' },
      { label: 'Failed', value: failed, color: '#ef4444' },
    ]
  }, [row])
  return (
    <div style={{display:'grid', gap:8}}>
      <select className="input select" value={t} onChange={e=> setT(e.target.value)}>
        {tests.map(x=> <option key={x} value={x}>{x}</option>)}
      </select>
      <PieChart data={pie} />
    </div>
  )
}
