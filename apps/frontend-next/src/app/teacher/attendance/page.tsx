"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import {
  seedIfNeeded,
  getClasses,
  getSectionsForClass,
  rosterBy,
  saveAttendance,
  readAttendance,
  readAttendanceTopic,
  saveAttendanceTopic,
  getAssignedClassesForTeacher,
  getAssignedSectionsForTeacher,
  hourOptionsForClass,
  getHoursForClass,
  getAssignedSubjectsForTeacher,
  getSubjects,
  getClassSubjects,
} from '../data'

export default function TeacherAttendancePage() {
  const pathname = usePathname()
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<string>('')
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [hour, setHour] = React.useState<number>(1)
  const [present, setPresent] = React.useState<Record<string, 'P' | 'A' | 'L'>>({})
  const [attSubject, setAttSubject] = React.useState<string>('')
  const [attendanceTopic, setAttendanceTopic] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [notificationMessage, setNotificationMessage] = React.useState('')
  const [isSendingNotifications, setIsSendingNotifications] = React.useState(false)
  const [attendanceSaved, setAttendanceSaved] = React.useState(false)

  React.useEffect(() => {
    seedIfNeeded()
    try {
      const raw = sessionStorage.getItem('teacher')
      if (!raw) return
      const obj = JSON.parse(raw)
      setTeacher(obj)
      const classes = getAssignedClassesForTeacher(obj.name)
      if (classes.length) {
        const first = classes[0]
        setKlass(first)
        const secs = getAssignedSectionsForTeacher(obj.name, first)
        setSection(secs[0] || getSectionsForClass(first)[0] || '')
      } else {
        const all = getClasses()
        const first = all[0] || ''
        setKlass(first)
        setSection(getSectionsForClass(first)[0] || '')
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : arr[0] || ''
    })
    try {
      const max = getHoursForClass(klass)
      setHour(h => (h <= max ? h : 1))
    } catch {}
  }, [klass])

  const attSubjects = React.useMemo(() => {
    if (!teacher) return [] as string[]
    const assigned = getAssignedSubjectsForTeacher(teacher.name, klass, section)
    const classSubs = getClassSubjects(klass, section)
    const base = assigned.length ? assigned : classSubs.length ? classSubs : getSubjects()
    return base.length ? base : teacher.subject ? [teacher.subject] : getSubjects()
  }, [teacher, klass, section])

  React.useEffect(() => {
    if (!attSubjects.length) return
    setAttSubject(prev => (attSubjects.includes(prev) ? prev : attSubjects[0]))
  }, [attSubjects])

  React.useEffect(() => {
    const map = readAttendance(date, klass, section, hour)
    const next: Record<string, 'P' | 'A' | 'L'> = {}
    for (const key of Object.keys(map || {})) {
      const v = (map as any)[key]
      if (v === true || v === 'P') next[key] = 'P'
      else if (v === 'L') next[key] = 'L'
      else next[key] = 'A'
    }
    setPresent(next)
    const topic = readAttendanceTopic(date, klass, section, hour)
    setAttendanceTopic(topic || '')
    // Reset notification state when changing attendance slot
    setAttendanceSaved(false)
    setNotificationMessage('')
  }, [date, klass, section, hour])

  const students = React.useMemo(() => rosterBy(klass, section), [klass, section])

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

  const onSaveAttendance = () => {
    const full: Record<string, 'P' | 'A' | 'L'> = {}
    for (const s of students) {
      const v = present[s.usn] || 'A'
      full[s.usn] = v
    }
    saveAttendance(date, klass, section, hour, full, attSubject || undefined)
    if (attendanceTopic.trim()) {
      saveAttendanceTopic(date, klass, section, hour, attendanceTopic)
    }
    const hourLabel = `Hour ${hour}`
    const classLabel = klass || 'Class'
    const sectionLabel = section || ''
    const subjectLabel = attSubject || 'Subject'
    const dateLabel = date || new Date().toISOString().slice(0, 10)
    setMessage(`Attendance saved for ${classLabel} ${sectionLabel} • ${dateLabel} • ${hourLabel} • ${subjectLabel}`)
    setAttendanceSaved(true)
    setNotificationMessage('')
    setTimeout(() => setMessage(''), 1500)
  }

  const absentCount = React.useMemo(() => {
    return students.filter(s => present[s.usn] === 'A').length
  }, [students, present])

  const onSendNotifications = async () => {
    const absentStudents = students.filter(s => present[s.usn] === 'A').map(s => s.usn)
    
    if (absentStudents.length === 0) {
      setNotificationMessage('No absent students to notify')
      setTimeout(() => setNotificationMessage(''), 3000)
      return
    }

    setIsSendingNotifications(true)
    setNotificationMessage('Sending notifications...')

    try {
      const response = await fetch('/api/attendance/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          klass,
          section,
          hour,
          absentStudents
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setNotificationMessage(`✅ ${result.message}`)
        if (result.skipped > 0) {
          setTimeout(() => {
            setNotificationMessage(prev => `${prev} (${result.skipped} skipped - no phone number)`)
          }, 100)
        }
      } else {
        setNotificationMessage(`❌ ${result.message || 'Failed to send notifications'}`)
      }
    } catch (error) {
      console.error('Notification error:', error)
      setNotificationMessage('❌ Failed to send notifications. Please try again.')
    } finally {
      setIsSendingNotifications(false)
      setTimeout(() => setNotificationMessage(''), 5000)
    }
  }

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
          <h2 className="title">Mark Attendance</h2>
          <p className="subtitle">
            Choose class, section, date, hour, and subject to record per-period attendance.
          </p>

          <section className="cal" aria-label="Attendance">
            <div className="cal-head">
              <div className="cal-title">Attendance for selected period</div>
            </div>
            <div style={{ display: 'grid', gap: 12, padding: 18 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="input select"
                  value={klass}
                  onChange={e => setKlass(e.target.value)}
                >
                  {(teacher
                    ? getAssignedClassesForTeacher(teacher.name).length
                      ? getAssignedClassesForTeacher(teacher.name)
                      : getClasses()
                    : getClasses()
                  ).map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="input select"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                >
                  {(teacher
                    ? getAssignedSectionsForTeacher(teacher.name, klass).length
                      ? getAssignedSectionsForTeacher(teacher.name, klass)
                      : getSectionsForClass(klass)
                    : getSectionsForClass(klass)
                  ).map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
                <select
                  className="input select"
                  value={hour}
                  onChange={e => setHour(Number(e.target.value))}
                >
                  {hourOptionsForClass(klass).map(h => (
                    <option key={h} value={h}>
                      Hour {h}
                    </option>
                  ))}
                </select>
                <select
                  className="input select"
                  value={attSubject}
                  onChange={e => setAttSubject(e.target.value)}
                >
                  {attSubjects.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="label" style={{ fontSize: 12 }}>
                    Topic (optional)
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g., Algebra – Linear Equations"
                    value={attendanceTopic}
                    onChange={e => setAttendanceTopic(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="actions">
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => {
                      const map: Record<string, 'P' | 'A' | 'L'> = {}
                      for (const s of students) map[s.usn] = 'P'
                      setPresent(map)
                    }}
                  >
                    Mark all present
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 8,
                  }}
                >
                  {students.map(s => {
                    const mark = present[s.usn] || 'A'
                    return (
                      <label
                        key={s.usn}
                        style={{
                          border: '1px solid var(--panel-border)',
                          borderRadius: 10,
                          padding: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {s.usn} — {s.name}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn-tiny"
                            style={{
                              padding: '2px 8px',
                              minWidth: 30,
                              background:
                                mark === 'P'
                                  ? 'rgba(22,163,74,0.18)'
                                  : 'rgba(148,163,184,0.10)',
                              color: mark === 'P' ? '#166534' : 'inherit',
                            }}
                            onClick={() =>
                              setPresent(prev => ({
                                ...prev,
                                [s.usn]: 'P',
                              }))
                            }
                          >
                            P
                          </button>
                          <button
                            type="button"
                            className="btn-tiny"
                            style={{
                              padding: '2px 8px',
                              minWidth: 30,
                              background:
                                mark === 'A'
                                  ? 'rgba(220,38,38,0.18)'
                                  : 'rgba(148,163,184,0.10)',
                              color: mark === 'A' ? '#991b1b' : 'inherit',
                            }}
                            onClick={() =>
                              setPresent(prev => ({
                                ...prev,
                                [s.usn]: 'A',
                              }))
                            }
                          >
                            A
                          </button>
                          <button
                            type="button"
                            className="btn-tiny"
                            style={{
                              padding: '2px 8px',
                              minWidth: 30,
                              background:
                                mark === 'L'
                                  ? 'rgba(249,115,22,0.18)'
                                  : 'rgba(148,163,184,0.10)',
                              color: mark === 'L' ? '#9a3412' : 'inherit',
                            }}
                            onClick={() =>
                              setPresent(prev => ({
                                ...prev,
                                [s.usn]: 'L',
                              }))
                            }
                          >
                            L
                          </button>
                        </div>
                      </label>
                    )
                  })}
                </div>
                <div className="actions" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  {message && (
                    <div
                      className="badge info"
                      style={{ marginBottom: 4, alignSelf: 'stretch', textAlign: 'left' }}
                    >
                      {message}
                    </div>
                  )}
                  <button className="btn" type="button" onClick={onSaveAttendance}>
                    Save Attendance
                  </button>
                  
                  {attendanceSaved && absentCount > 0 && (
                    <div style={{ marginTop: 8, width: '100%' }}>
                      <div style={{ 
                        padding: '12px', 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        borderRadius: 8,
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        marginBottom: 8
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          📱 Send WhatsApp Notifications
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {absentCount} student{absentCount !== 1 ? 's' : ''} marked absent
                        </div>
                      </div>
                      
                      {notificationMessage && (
                        <div
                          className="badge info"
                          style={{ marginBottom: 8, width: '100%', textAlign: 'left' }}
                        >
                          {notificationMessage}
                        </div>
                      )}
                      
                      <button 
                        className="btn-ghost" 
                        type="button" 
                        onClick={onSendNotifications}
                        disabled={isSendingNotifications}
                        style={{ width: '100%' }}
                      >
                        {isSendingNotifications 
                          ? 'Sending...' 
                          : `Send to Absent Students (${absentCount})`
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  )
}

