"use client"
import React from 'react'
import { getClasses, getSectionsForClass, getSubjects, rosterBy, readMarks, saveMarks, listTestsBySubject, getAssignedClassesForTeacher, getAssignedSectionsForTeacher, getAssignedSubjectsForTeacher, getClassSubjects, readTotalsByTest } from '../data'

export default function TeacherMarks() {
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<string>('')
  const [subject, setSubject] = React.useState<string>('')
  const [allowedSubjects, setAllowedSubjects] = React.useState<string[]>([])
  const [test, setTest] = React.useState<string>('UT-1')
  // Initialize date after mount to avoid SSR/client timezone mismatches
  const [date, setDate] = React.useState<string>('')
  const [max, setMax] = React.useState<number>(50)
  const [marks, setMarks] = React.useState<Record<string, number>>({})
  const [message, setMessage] = React.useState('')
  const [suggestedTests, setSuggestedTests] = React.useState<string[]>([])
  const [totals, setTotals] = React.useState<Array<{ usn: string; sum: number; total: number; pct: number }>>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Mark as mounted and set default date on client
    setMounted(true)
    if (!date) {
      try { setDate(new Date().toISOString().slice(0,10)) } catch {}
    }
    try { const raw = sessionStorage.getItem('teacher'); if (raw) {
      const t = JSON.parse(raw); setTeacher(t)
      const classes = getAssignedClassesForTeacher(t.name)
      if (classes.length) {
        setKlass(classes[0])
        const secs = getAssignedSectionsForTeacher(t.name, classes[0])
        setSection(secs[0] || getSectionsForClass(classes[0])[0] || '')
        const subs = getAssignedSubjectsForTeacher(t.name, classes[0], secs[0])
        const classSubs = getClassSubjects(classes[0], secs[0])
        const fallback = classSubs.length ? classSubs : (t.subject ? [t.subject] : getSubjects())
        const list = (subs.length ? subs : fallback)
        setAllowedSubjects(list)
        setSubject(list[0] || '')
      } else {
        const all = getClasses(); setKlass(all[0] || ''); setSection(getSectionsForClass(all[0] || '')[0] || '')
        const classSubs = getClassSubjects(all[0] || '', (getSectionsForClass(all[0] || '')[0] || ''))
        const fallback = classSubs.length ? classSubs : (t.subject ? [t.subject] : getSubjects())
        setAllowedSubjects(fallback)
        setSubject(fallback[0] || '')
      }
    } } catch {}
  }, [])

  // Live updates for assignments/subjects and marks suggestions
  React.useEffect(() => {
    const refreshSubjects = () => {
      if (!teacher) return
      const subs = getAssignedSubjectsForTeacher(teacher.name, klass, section)
      const fallback = teacher.subject ? [teacher.subject] : getSubjects()
      const list = (subs.length ? subs : fallback)
      setAllowedSubjects(list)
      setSubject(prev => (list.includes(prev) ? prev : (list[0] || '')))
    }
    const refreshTests = () => {
      try { setSuggestedTests(listTestsBySubject(klass, section as any, subject)) } catch { setSuggestedTests([]) }
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key as string | undefined
        if (!key) { refreshSubjects(); refreshTests(); return }
        if (key === 'school:assignments' || key === 'school:subjects' || key === 'school:classSubjects' || key === 'school:teachers') refreshSubjects()
        if (key === 'school:marks') refreshTests()
      } catch { refreshSubjects(); refreshTests() }
    }
    window.addEventListener('school:update', onBus as EventListener)
    return () => window.removeEventListener('school:update', onBus as EventListener)
  }, [teacher, klass, section, subject])

  const students = React.useMemo(() => rosterBy(klass, section), [klass, section])

  React.useEffect(() => {
    try { setSuggestedTests(listTestsBySubject(klass, section as any, subject)) } catch { setSuggestedTests([]) }
  }, [klass, section, subject])

  React.useEffect(() => {
    if (!teacher) return
    const subs = getAssignedSubjectsForTeacher(teacher.name, klass, section)
    const classSubs = getClassSubjects(klass, section)
    const fallback = classSubs.length ? classSubs : (teacher.subject ? [teacher.subject] : getSubjects())
    const list = (subs.length ? subs : fallback)
    setAllowedSubjects(list)
    setSubject(prev => (list.includes(prev) ? prev : (list[0] || '')))
  }, [teacher, klass, section])

  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [klass])

  const loadExisting = React.useCallback(() => {
    try {
      const sheet = readMarks(klass, section as any, subject, test)
      if (sheet) { setMarks(sheet.marks || {}); setMax(sheet.max || 50); if (sheet.date) setDate(sheet.date) }
      else { setMarks({}); }
    } catch {}
  }, [klass, section, subject, test])

  React.useEffect(() => { loadExisting() }, [loadExisting])

  // Compute class/section ranking for current test
  React.useEffect(() => {
    try { setTotals(readTotalsByTest(klass, section as any, test)) } catch { setTotals([]) }
  }, [klass, section, test])

  const onSave = () => {
    const t = test.trim()
    if (!t) { setMessage('Enter test name'); setTimeout(()=>setMessage(''), 1200); return }
    if (!Number.isFinite(max) || max <= 0) { setMessage('Enter valid max marks'); setTimeout(()=>setMessage(''), 1200); return }
    if (allowedSubjects.length && !allowedSubjects.includes(subject)) { setMessage('You are not assigned to this subject'); setTimeout(()=>setMessage(''), 1500); return }
    // Build marks map ensuring only numbers
    const normalized: Record<string, number> = {}
    for (const s of students) {
      const v = Number(marks[s.usn])
      if (!isNaN(v)) normalized[s.usn] = Math.max(0, Math.min(v, max))
    }
    saveMarks({ test: t, subject, klass, section: section as any, date, max, marks: normalized, createdBy: teacher?.name })
    setMessage('Marks saved.')
    setTimeout(()=>setMessage(''), 1500)
    setSuggestedTests(listTestsBySubject(klass, section as any, subject))
  }

  return (
    <div className="dash">
      <h2 className="title">Marks Entry</h2>
      <p className="subtitle">Enter subject-wise marks and save by test name. View exam-wise class/section ranking below.</p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        <div className="row">
          <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>
            {(mounted ? (teacher ? (getAssignedClassesForTeacher(teacher.name).length ? getAssignedClassesForTeacher(teacher.name) : getClasses()) : getClasses()) : []).map(c=> <option key={c}>{c}</option>)}
          </select>
          <select className="input select" value={section} onChange={e=>setSection(e.target.value)}>
            {(mounted ? (teacher ? (getAssignedSectionsForTeacher(teacher.name, klass).length ? getAssignedSectionsForTeacher(teacher.name, klass) : getSectionsForClass(klass)) : getSectionsForClass(klass)) : []).map(s=> <option key={s}>{s}</option>)}
          </select>
          <select className="input select" value={subject} onChange={e=>setSubject(e.target.value)}>
            {(mounted ? (allowedSubjects.length ? allowedSubjects : getSubjects()) : []).map(s=> <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="row">
          <input className="input" placeholder="Test name e.g. UT-1" list="test-suggestions" value={test} onChange={e=>setTest(e.target.value)} onBlur={loadExisting} />
          <datalist id="test-suggestions">
            {suggestedTests.map(t => <option key={t} value={t} />)}
          </datalist>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <input className="input" type="number" min={1} placeholder="Max marks" value={max} onChange={e=>setMax(Number(e.target.value))} />
        </div>

        <div style={{display:'grid', gap:8}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 120px', gap:8, padding:'8px 10px', border:'1px solid var(--panel-border)', borderRadius:8, background:'var(--panel-soft)'}}>
            <strong>Student</strong>
            <strong>Marks</strong>
          </div>
          {students.map(s => (
            <div key={s.usn} style={{display:'grid', gridTemplateColumns:'1fr 120px', gap:8, alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'8px 10px'}}>
              <div style={{fontWeight:600}}>{s.usn} — {s.name}</div>
              <input className="input" type="number" min={0} max={max} value={marks[s.usn] ?? ''} onChange={e=>{
                const v = e.target.value === '' ? NaN : Number(e.target.value)
                setMarks(prev => ({ ...prev, [s.usn]: isNaN(v) ? (prev[s.usn] ?? NaN) : v }))
              }} placeholder={`0-${max}`} />
            </div>
          ))}
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={onSave}>Save Marks</button>
        </div>
        {message && <div className="profile-message">{message}</div>}

        <div className="card" style={{marginTop:12}}>
          <div className="actions" style={{justifyContent:'space-between'}}>
            <div style={{fontWeight:800}}>Ranking • {klass} {section ? `• ${section}` : ''} • {subject} • {test}</div>
            <div className="note">Total students: {totals.length}</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'60px 1fr 140px 100px', gap:6, padding:'8px 10px', border:'1px solid var(--panel-border)', borderRadius:8, background:'var(--panel-soft)', fontWeight:700}}>
            <div>Rank</div>
            <div>Student</div>
            <div style={{textAlign:'center'}}>Marks</div>
            <div style={{textAlign:'right'}}>Percent</div>
          </div>
          <div style={{display:'grid', gap:6, marginTop:8}}>
            {totals.map((t, idx) => (
              <div key={t.usn} style={{display:'grid', gridTemplateColumns:'60px 1fr 140px 100px', gap:6, alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'8px 10px'}}>
                <div>{idx+1}</div>
                <div>{t.usn} — {students.find(s => s.usn === t.usn)?.name || 'Student'}</div>
                <div style={{textAlign:'center'}}>{t.sum} / {t.total}</div>
                <div style={{textAlign:'right', fontWeight:800}}>{t.pct}%</div>
              </div>
            ))}
            {totals.length === 0 && <div className="note">No ranking data yet. Save marks or select a different test.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
