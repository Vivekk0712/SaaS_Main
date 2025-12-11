"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, getClassSubjects, readSyllabus } from '../../teacher/data'

export default function SyllabusPage() {
  const pathname = usePathname()
  const [me, setMe] = React.useState<{ klass: string; section: string; usn: string } | null>(null)
  const [subjects, setSubjects] = React.useState<string[]>([])

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/progress', label: 'Progress', icon: '📊' },
    { href: '/student/attendance', label: 'Attendance', icon: '✅' },
    { href: '/student/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/student/calendar', label: 'Calendar', icon: '📅' },
    { href: '/student/circulars', label: 'Circulars', icon: '📣' },
    { href: '/student/syllabus', label: 'Academic Syllabus', icon: '📘' }
  ]

  React.useEffect(() => {
    try { const raw = sessionStorage.getItem('student'); if (raw) {
      const { roll } = JSON.parse(raw); const s = findStudent(roll); if (s) { setMe({ klass: s.klass, section: s.section as any, usn: s.usn }); setSubjects(getClassSubjects(s.klass, s.section)) }
    } } catch {}
  }, [])

  React.useEffect(() => {
    const recompute = () => {
      try { const raw = sessionStorage.getItem('student'); if (!raw) return; const { roll } = JSON.parse(raw); const s = findStudent(roll); if (s) setSubjects(getClassSubjects(s.klass, s.section)) } catch {}
    }
    const onBus = (e: Event) => {
      try { const k = (e as CustomEvent).detail?.key; if (!k || k === 'school:classSubjects' || k === 'school:syllabus' || k === 'school:textbooks' || k === 'school:materials') recompute() } catch { recompute() }
    }
    window.addEventListener('school:update', onBus as EventListener)
    return () => window.removeEventListener('school:update', onBus as EventListener)
  }, [])

  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null)

  return (
    <div className="student-shell">
      <div className="topbar topbar-student">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>STUDENT</strong>
          </div>
          <nav className="tabs" aria-label="Student quick navigation tabs">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                className="tab"
                style={{ pointerEvents: 'none', opacity: 0.4 }}
                aria-hidden="true"
              >
                &nbsp;
              </button>
            ))}
          </nav>
          <div />
        </div>
      </div>
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

          <div className="dash">
            <div
              style={{
                height: 6,
                width: 64,
                borderRadius: 999,
                background: '#3b2c1a',
                marginBottom: 10,
              }}
            />
            <h2 className="title">Academic Syllabus</h2>
            <p className="subtitle">
              Tap a subject to see its chapters, then tap a chapter to open notes and PDFs shared by teachers.
            </p>

            <div
              className="parent"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridAutoRows: 'minmax(120px, auto)',
                gap: 12,
                marginTop: 16,
              }}
            >
              {subjects.map((s, index) => {
                const palette = [
                  'linear-gradient(135deg, #0b1220, #1d4ed8)',
                  'linear-gradient(135deg, #022c22, #059669)',
                  'linear-gradient(135deg, #111827, #7c3aed)',
                  'linear-gradient(135deg, #3f1f0e, #ea580c)',
                  'linear-gradient(135deg, #111827, #14b8a6)',
                  'linear-gradient(135deg, #31102b, #e11d48)',
                ]
                const bg = palette[index % palette.length]
                const active = selectedSubject === s
                const href = `/student/syllabus/subject?subject=${encodeURIComponent(s)}` as Route
                return (
                  <Link
                    key={s}
                    href={href}
                    style={{
                      borderRadius: 14,
                      padding: 18,
                      background: bg,
                      boxShadow: '0 16px 32px rgba(15,23,42,0.7)',
                      border: active ? '2px solid #f97316' : '1px solid rgba(148,163,184,0.7)',
                      color: '#f9fafb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        fontFamily:
                          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        fontWeight: 900,
                        fontSize: 18,
                        letterSpacing: 0.5,
                        textShadow: '0 3px 10px rgba(0,0,0,0.85)',
                      }}
                    >
                      {s}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        bottom: 10,
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: 'rgba(15,23,42,0.85)',
                        border: '1px solid rgba(148,163,184,0.6)',
                      }}
                    >
                      {active ? 'Tap to hide' : 'Tap to view chapters'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
