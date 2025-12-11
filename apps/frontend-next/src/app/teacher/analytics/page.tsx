"use client"

import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import {
  getClasses,
  getSectionsForClass,
  getClassSubjects,
  readMarksByStudent,
  rosterBy,
  getAssignedClassesForTeacher,
  getAssignedSectionsForTeacher,
} from '../data'
import { BarChart, type BarSeries } from '../../components/BarChart'

type MarkRecord = {
  test: string
  subject: string
  score: number
  max: number
  date?: string
  klass: string
  section: string
}

type Mode = 'subject' | 'overall'
type CompareMode = 'students' | 'sections'

const navLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
  { href: '/teacher/analytics', label: 'Analytics', icon: '📈' },
  { href: '/teacher/assignments', label: 'Assignments', icon: '📚' },
  { href: '/teacher/diary', label: 'Digital Diary', icon: '📔' },
  { href: '/teacher/calendar', label: 'Academic Calendar', icon: '📅' },
  { href: '/teacher/marks', label: 'Marks Entry', icon: '✏️' },
  { href: '/teacher/academic-content', label: 'Academic Content', icon: '📘' },
  { href: '/teacher/circulars', label: 'Circulars', icon: '📣' },
]

export default function TeacherAnalyticsPage() {
  const pathname = usePathname()
  const [klass, setKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [section, setSection] = React.useState<string>(() => getSectionsForClass(getClasses()[0] || '')[0] || '')
  const [mode, setMode] = React.useState<Mode>('subject')
  const [compareMode, setCompareMode] = React.useState<CompareMode>('students')
  const [selectedUsns, setSelectedUsns] = React.useState<string[]>([])
  const [selectedSections, setSelectedSections] = React.useState<string[]>([])
  const [recordsByStudent, setRecordsByStudent] = React.useState<Record<string, MarkRecord[]>>({})
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const pickerRef = React.useRef<HTMLDivElement | null>(null)
  const [teacherName, setTeacherName] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [klass])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (!raw) return
      const t = JSON.parse(raw)
      if (t?.name) {
        const name = String(t.name)
        setTeacherName(name)
        const assignedClasses = getAssignedClassesForTeacher(name)
        if (assignedClasses.length) {
          const first = assignedClasses[0]
          setKlass(first)
          const secs = getAssignedSectionsForTeacher(name, first)
          setSection(secs[0] || getSectionsForClass(first)[0] || '')
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const classOptions = React.useMemo(() => {
    if (teacherName) {
      const assigned = getAssignedClassesForTeacher(teacherName)
      const base = assigned.length ? assigned : getClasses()
      return base
    }
    return getClasses()
  }, [teacherName])

  const sectionOptions = React.useMemo(() => {
    if (teacherName) {
      const assigned = getAssignedSectionsForTeacher(teacherName, klass)
      const base = assigned.length ? assigned : getSectionsForClass(klass)
      return base
    }
    return getSectionsForClass(klass)
  }, [teacherName, klass])

  const students = React.useMemo(() => rosterBy(klass, section), [klass, section])

  React.useEffect(() => {
    setSelectedUsns([])
    setSelectedSections([])
    setRecordsByStudent({})
  }, [klass, section])

  React.useEffect(() => {
    if (!pickerOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (pickerRef.current && pickerRef.current.contains(target)) return
      setPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [pickerOpen])

  React.useEffect(() => {
    const next: Record<string, MarkRecord[]> = {}
    for (const usn of selectedUsns) {
      try {
        next[usn] = readMarksByStudent(usn) as MarkRecord[]
      } catch {
        next[usn] = []
      }
    }
    setRecordsByStudent(next)
  }, [selectedUsns])

  const subjects = getClassSubjects(klass, section)

  const subjectCategories = React.useMemo(() => {
    const base = subjects.length
      ? subjects
      : Array.from(
          new Set(
            Object.values(recordsByStudent)
              .flat()
              .map(r => r.subject || ''),
          ),
        ).filter(Boolean)
    return base
  }, [subjects, recordsByStudent])

  const barData: { categories: string[]; series: BarSeries[] } = React.useMemo(() => {
    const palette = ['#2563eb', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#0ea5e9']

    if (compareMode === 'students') {
      const cats = subjectCategories.length ? subjectCategories : ['All Subjects']
      if (cats.length === 0 || selectedUsns.length === 0) {
        return { categories: [], series: [] }
      }

      const series: BarSeries[] = []

      selectedUsns.forEach((usn, idx) => {
        const recs = recordsByStudent[usn] || []
        const name = students.find(s => s.usn === usn)?.name || usn
        if (mode === 'subject') {
          const totals = new Map<string, { scored: number; max: number }>()
          for (const r of recs) {
            const key = r.subject.toUpperCase()
            const row = totals.get(key) || { scored: 0, max: 0 }
            row.scored += Number(r.score || 0)
            row.max += Number(r.max || 0)
            totals.set(key, row)
          }
          const data = cats.map(sub => {
            const key = sub.toUpperCase()
            const t = totals.get(key)
            if (!t || !t.max) return null
            return Math.round((t.scored * 100) / t.max)
          })
          series.push({
            name,
            color: palette[idx % palette.length],
            data,
          })
        } else {
          let scored = 0
          let max = 0
          for (const r of recs) {
            scored += Number(r.score || 0)
            max += Number(r.max || 0)
          }
          const pct = max ? Math.round((scored * 100) / max) : null
          series.push({
            name,
            color: palette[idx % palette.length],
            data: [pct],
          })
        }
      })

      return {
        categories: mode === 'subject' ? cats : ['Overall %'],
        series,
      }
    }

    const sections = selectedSections.length ? selectedSections : sectionOptions
    if (!sections.length) return { categories: [], series: [] }

    if (mode === 'subject') {
      const cats = subjectCategories.length ? subjectCategories : ['All Subjects']
      if (!cats.length) return { categories: [], series: [] }

      const series: BarSeries[] = []
      sections.forEach((sec, idx) => {
        const roster = rosterBy(klass, sec)
        const totals = new Map<string, { scored: number; max: number }>()
        for (const s of roster) {
          let recs: MarkRecord[] = []
          try {
            recs = readMarksByStudent(s.usn) as MarkRecord[]
          } catch {
            recs = []
          }
          for (const r of recs) {
            const key = r.subject.toUpperCase()
            const row = totals.get(key) || { scored: 0, max: 0 }
            row.scored += Number(r.score || 0)
            row.max += Number(r.max || 0)
            totals.set(key, row)
          }
        }
        const data = cats.map(sub => {
          const key = sub.toUpperCase()
          const t = totals.get(key)
          if (!t || !t.max) return null
          return Math.round((t.scored * 100) / t.max)
        })
        series.push({
          name: `Section ${sec}`,
          color: palette[idx % palette.length],
          data,
        })
      })
      return { categories: cats, series }
    }

    const series: BarSeries[] = []
    sections.forEach((sec, idx) => {
      const roster = rosterBy(klass, sec)
      let scored = 0
      let max = 0
      for (const s of roster) {
        let recs: MarkRecord[] = []
        try {
          recs = readMarksByStudent(s.usn) as MarkRecord[]
        } catch {
          recs = []
        }
        for (const r of recs) {
          scored += Number(r.score || 0)
          max += Number(r.max || 0)
        }
      }
      const pct = max ? Math.round((scored * 100) / max) : null
      series.push({
        name: `Section ${sec}`,
        color: palette[idx % palette.length],
        data: [pct],
      })
    })
    return { categories: ['Overall %'], series }
  }, [compareMode, mode, subjectCategories, selectedUsns, selectedSections, recordsByStudent, students, klass, sectionOptions])

  const toggleStudent = (usn: string) => {
    setSelectedUsns(prev => (prev.includes(usn) ? prev.filter(x => x !== usn) : [...prev, usn]))
  }

  const combinedStudentsList = React.useMemo(() => {
    const secs = sectionOptions
    const all: Array<{ usn: string; name: string; section: string }> = []
    for (const sec of secs) {
      const roster = rosterBy(klass, sec)
      roster.forEach(s => {
        all.push({ usn: s.usn, name: s.name, section: sec })
      })
    }
    const q = searchTerm.trim().toLowerCase()
    if (!q) return all
    return all.filter(s => s.usn.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }, [sectionOptions, klass, searchTerm])

  return (
    <div className="teacher-shell">
      <div className="topbar topbar-teacher">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Teacher</strong>
          </div>
        </div>
      </div>

      <div className="dash-wrap teacher-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-teacher" aria-label="Teacher quick navigation">
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

          <div className="dash">
            <h2 className="title">Progress &amp; Marks Analytics</h2>
            <p className="subtitle">
              Choose a class/section, pick one or more students, and view subject-wise or overall
              performance in bar charts.
            </p>

            <div className="chart-card" style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                <select className="input select" value={klass} onChange={e => setKlass(e.target.value)}>
                  {(mounted ? classOptions : klass ? [klass] : []).map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select className="input select" value={section} onChange={e => setSection(e.target.value)}>
                  {(mounted ? sectionOptions : section ? [section] : []).map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="label">Compare:</span>
                  <button
                    type="button"
                    className={`btn-ghost ${compareMode === 'students' ? 'tab-active' : ''}`}
                    onClick={() => {
                      setCompareMode('students')
                      setSelectedSections([])
                    }}
                    style={{ paddingInline: 10 }}
                  >
                    Students
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${compareMode === 'sections' ? 'tab-active' : ''}`}
                    onClick={() => {
                      setCompareMode('sections')
                      setSelectedUsns([])
                    }}
                    style={{ paddingInline: 10 }}
                  >
                    Sections
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="label">Mode:</span>
                  <button
                    type="button"
                    className={`btn-ghost ${mode === 'subject' ? 'tab-active' : ''}`}
                    onClick={() => setMode('subject')}
                    style={{ paddingInline: 10 }}
                  >
                    Subject-wise %
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${mode === 'overall' ? 'tab-active' : ''}`}
                    onClick={() => setMode('overall')}
                    style={{ paddingInline: 10 }}
                  >
                    Overall %
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setSelectedUsns([])
                    setSelectedSections([])
                  }}
                  disabled={selectedUsns.length === 0 && selectedSections.length === 0}
                >
                  Clear selection
                </button>
              </div>

              {compareMode === 'students' ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ position: 'relative' }} ref={pickerRef}>
                    <div className="label" style={{ marginBottom: 4 }}>
                      Students (filter &amp; compare):
                    </div>
                    <button
                      type="button"
                      className="input"
                      style={{
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPickerOpen(o => !o)}
                    >
                      <span>
                        {selectedUsns.length === 0
                          ? 'Select students'
                          : `${selectedUsns.length} student${selectedUsns.length > 1 ? 's' : ''} selected`}
                      </span>
                      <span style={{ opacity: 0.7 }}>{pickerOpen ? '▲' : '▼'}</span>
                    </button>
                    {pickerOpen && (
                      <div
                        className="card"
                        style={{
                          position: 'absolute',
                          zIndex: 20,
                          marginTop: 6,
                          padding: 10,
                          maxHeight: 220,
                          overflowY: 'auto',
                          width: '100%',
                        }}
                      >
                        {combinedStudentsList.length === 0 && (
                          <div className="note">No students loaded for this class.</div>
                        )}
                        {combinedStudentsList.map(s => {
                          const active = selectedUsns.includes(s.usn)
                          return (
                            <label
                              key={`${s.section}-${s.usn}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                                padding: '4px 2px',
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{ fontSize: 12 }}>
                                {s.usn} — {s.name} (Sec {s.section})
                              </span>
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggleStudent(s.usn)}
                              />
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <input
                    className="input"
                    placeholder="Search by name or roll"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>
                    Sections (compare):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {sectionOptions.map(sec => {
                      const active = selectedSections.includes(sec)
                      return (
                        <label
                          key={sec}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 8px',
                            borderRadius: 999,
                            border: active ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: 11 }}>Section {sec}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              setSelectedSections(prev =>
                                prev.includes(sec) ? prev.filter(x => x !== sec) : [...prev, sec],
                              )
                            }
                          />
                        </label>
                      )
                    })}
                    {sectionOptions.length === 0 && (
                      <div className="note">No sections configured for this class.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {barData.categories.length > 0 && barData.series.length > 0 ? (
              <section className="card" style={{ marginTop: 14 }}>
                <BarChart
                  title={
                    compareMode === 'students'
                      ? mode === 'subject'
                        ? 'Subject-wise percentage comparison (students)'
                        : 'Overall percentage comparison (students)'
                      : mode === 'subject'
                        ? 'Subject-wise percentage comparison (sections)'
                        : 'Overall percentage comparison (sections)'
                  }
                  categories={barData.categories}
                  series={barData.series}
                  yMax={100}
                  yTicks={[0, 20, 40, 60, 80, 100]}
                  height={320}
                />
              </section>
            ) : (
              <div className="note" style={{ marginTop: 14 }}>
                Select at least one student with marks recorded to see analytics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
