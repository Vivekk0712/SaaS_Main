"use client"
import React from 'react'
import Link from 'next/link'
import { getClasses, getSectionsForClass, rosterBy, seedIfNeeded, getAssignedClassesForTeacher, getAssignedSectionsForTeacher, type Student } from '../data'

export default function TeacherStudents() {
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<string>('') // 'A' | 'B'
  const [classOptions, setClassOptions] = React.useState<string[]>([])
  const [sectionOptions, setSectionOptions] = React.useState<string[]>([])

  React.useEffect(() => {
    const arr = getSectionsForClass(klass)
    setSectionOptions(arr)
    setSection(prev => (arr.includes(prev) ? prev : arr[0] || ''))
  }, [klass])
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      const initDefault = () => {
        const baseClasses = getClasses()
        setClassOptions(baseClasses)
        const firstClass = baseClasses[0] || ''
        setKlass(firstClass)
        const baseSections = firstClass ? getSectionsForClass(firstClass) : []
        setSectionOptions(baseSections)
        setSection(baseSections[0] || '')
      }
      if (!raw) {
        initDefault()
        return
      }
      const t = JSON.parse(raw)
      const classes = getAssignedClassesForTeacher(t.name)
      const baseClasses = classes.length ? classes : getClasses()
      setClassOptions(baseClasses)
      const firstClass = baseClasses[0] || ''
      setKlass(firstClass)
      const secs = getAssignedSectionsForTeacher(t.name, firstClass)
      const baseSections = secs.length ? secs : getSectionsForClass(firstClass)
      setSectionOptions(baseSections)
      setSection(baseSections[0] || '')
    } catch {}
  }, [])
  const [students, setStudents] = React.useState<Student[]>([])

  React.useEffect(() => { seedIfNeeded() }, [])

  React.useEffect(() => {
    if (!klass || !section) {
      setStudents([])
      return
    }
    setStudents(rosterBy(klass, section as 'A' | 'B'))
  }, [klass, section])

  return (
    <div>
      <div className="dash">
        <div className="tabs">
          <Link className={`tab`} href="/teacher/dashboard">Dashboard</Link>
          <Link className={`tab`} href="/teacher/academic-content">Academic Content</Link>
          <Link className={`tab`} href="/teacher/circulars">Circulars</Link>
          <Link className={`tab`} href="/teacher/marks">Marks Entry</Link>
          <span className={`tab tab-active`}>Students</span>
        </div>
      </div>

      <div className="dash">
        <h2 className="title">Students (Class Roster)</h2>
        <p className="subtitle">View students for the selected class and section. Students come from the central profiles; teachers do not need to add them here.</p>

        <div className="row">
          <select className="input select" value={klass} onChange={e=> setKlass(e.target.value)}>
            {classOptions.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input select" value={section} onChange={e=> setSection(e.target.value as 'A' | 'B')}>
            {sectionOptions.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{marginTop:14}}>
          <div className="subtitle" style={{marginBottom:8}}>Students in {klass || '—'} {section || ''} ({students.length})</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8}}>
            {students.map(s => (
              <div key={s.usn} style={{border:'1px solid var(--panel-border)', borderRadius:10, padding:10, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <span style={{fontWeight:600}}>{s.usn} — {s.name}</span>
                <span style={{opacity:0.7}}>{s.klass} {s.section}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash" style={{ marginTop: 24 }}>
        <Link className="back" href="/">&larr; Back to login</Link>
      </div>
    </div>
  )
}
