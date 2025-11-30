"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, readDiaryBy, readAssignments, readAssignmentStatusForStudent } from '../../teacher/data'

type DiaryViewEntry = {
  subject: string
  teacher: string
  note: string
  status: 'pending' | 'submitted'
  deadline?: string
  attachments?: any[]
}

export default function ParentDiaryPage() {
  const pathname = usePathname()
  const [parentName, setParentName] = React.useState('Parent')
  const [childName, setChildName] = React.useState('')
  const [klass, setKlass] = React.useState('')
  const [section, setSection] = React.useState<'A' | 'B' | ''>('')
  const [usn, setUsn] = React.useState('')
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [entries, setEntries] = React.useState<DiaryViewEntry[]>([])

  // Resolve child details from parent session / DB
  React.useEffect(() => {
    const load = async () => {
      try {
        const raw = sessionStorage.getItem('parent')
        if (!raw) return
        const sess = JSON.parse(raw)
        if (sess?.name) setParentName(String(sess.name))
        let roll = String(sess.roll || '')
        if (!roll && sess.phone) {
          try {
            const j = await (await fetch('/api/mysql/profiles/students')).json()
            const mine = (j.items || []).find((s: any) => String(s.parentPhone || '') === String(sess.phone))
            if (mine) {
              roll = String(mine.usn || '')
              setChildName(mine.name || '')
              setKlass(mine.grade || '')
              setSection((mine.section as any) || '')
              setUsn(roll)
              sessionStorage.setItem('parent', JSON.stringify({ ...sess, roll }))
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
            setUsn(me.usn)
          }
        }
      } catch {}
    }
    load()
  }, [])

  const recompute = React.useCallback(() => {
    if (!klass || !section) {
      setEntries([])
      return
    }
    try {
      let combined: any[] = readDiaryBy(date, klass, section as any) || []

      // Merge in any local diary entries for this date/class/section
      try {
        const raw = localStorage.getItem('school:diary')
        if (raw) {
          const store = JSON.parse(raw)
          const v = store[date]
          const arrLocal = v ? (Array.isArray(v) ? v : [v]) : []
          const localFiltered = arrLocal.filter(
            (e: any) => e.klass === klass && e.section === section
          )
          const seen = new Set<string>()
          const push = (e: any) => {
            const key = `${(e.subject || '').toLowerCase()}|${e.teacher || ''}|${e.note || ''}`
            if (seen.has(key)) return
            seen.add(key)
            combined.push(e)
          }
          combined.forEach(push)
          localFiltered.forEach(push)
        }
      } catch {
        // ignore local merge failures
      }

      // Fallback to assignments if still nothing
      if (!combined || combined.length === 0) {
        try {
          const backup = readAssignments(date, klass, section as any)
          if (backup && backup.length) {
            combined = backup.map(a => ({
              subject: a.subject || 'Subject',
              teacher: a.createdBy || 'Teacher',
              note: a.note || '',
              status: 'pending',
              attachments: a.attachments || []
            }))
          }
        } catch {}
      }

      const mapped: DiaryViewEntry[] = (combined || []).map((e: any) => {
        let status: 'pending' | 'submitted' = e.status === 'submitted' ? 'submitted' : 'pending'
        let deadline: string | undefined = e.deadline
        try {
          if (klass && section && usn && e.subject) {
            const s = readAssignmentStatusForStudent(date, klass, section as any, e.subject, usn)
            if (s?.status) status = s.status
            if (s?.deadline) deadline = s.deadline
          }
        } catch {}
        return {
          subject: e.subject || 'Subject',
          teacher: e.teacher || e.createdBy || 'Teacher',
          note: e.note || '',
          status,
          deadline,
          attachments: e.attachments || []
        }
      })
      setEntries(mapped)
    } catch {
      setEntries([])
    }
  }, [date, klass, section, usn])

  React.useEffect(() => {
    recompute()
  }, [recompute])

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:diary') recompute()
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key || key === 'school:diary') recompute()
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
  }, [recompute])

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
            <strong>PARENT</strong>
          </div>
          <nav className="tabs" aria-label="Parent navigation tabs">
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
            <h2 className="title">Digital Diary</h2>
            <p className="subtitle">Daily homework and class updates for your child.</p>

      <div className="card" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800 }}>{parentName}</div>
          <div className="note">
            Monitoring {childName || 'your child'}{klass ? ` • ${klass} ${section}` : ''}
          </div>
        </div>
        <div>
          <label className="label" style={{ fontSize: 12 }}>Select date</label>
          <input
            className="input diary-date-input"
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
          />
        </div>
      </div>

      {entries.length === 0 && (
        <div className="card" style={{ padding: 16, borderRadius: 16 }}>
          <div style={{ fontWeight: 600 }}>No diary updates for this date.</div>
          <p className="note">Teachers may not have published anything yet. Try another date or check back later.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: entries.length ? 8 : 0 }}>
        {entries.map((entry, idx) => {
          const isSubmitted = entry.status === 'submitted'
          const bannerColors = ['blue','green','orange','pink','violet'] as const
          const color = bannerColors[idx % bannerColors.length]
          return (
            <div
              key={`${entry.subject}-${idx}`}
              style={{
                border: '1px solid var(--panel-border)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--panel)',
                boxShadow: '0 10px 24px rgba(15,23,42,0.10)'
              }}
            >
              <div
                className={`diary-banner banner-${color}`}
                style={{ marginTop: 0, borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div className="diary-subject">{entry.subject}</div>
                  <span className="diary-teacher">Updated by {entry.teacher}</span>
                  {entry.deadline && (
                    <div className="note" style={{ fontSize: 11, marginTop: 2 }}>
                      Due: {entry.deadline.split('-').reverse().join('/')}
                    </div>
                  )}
                </div>
                <span
                  className="diary-lock"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isSubmitted ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.20)',
                    color: isSubmitted ? '#047857' : '#b91c1c'
                  }}
                >
                  {isSubmitted ? 'Submitted' : 'Pending'}
                </span>
              </div>
              {Array.isArray(entry.attachments) && entry.attachments.length > 0 && (
                <div style={{ display: 'grid', gap: 6, padding: '10px 14px' }}>
                  {entry.attachments.map((a: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px dashed var(--panel-border)',
                        borderRadius: 10,
                        padding: '8px 10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.type === 'link' ? a.url : a.name}
                        </span>
                      </div>
                      {a.type === 'link' ? (
                        <a className="back" href={a.url} target="_blank" rel="noopener noreferrer">Open</a>
                      ) : (
                        <a className="back" href={a.dataUrl} download={a.name}>Download</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="paper-view">{entry.note}</div>
            </div>
          )
        })}
      </div>

      <div className="dash" style={{ marginTop: 24 }}>
        <Link className="back" href="/parent/dashboard">
          &larr; Back to parent dashboard
        </Link>
      </div>
          </div>
        </div>
      </div>
    </div>
  )
}
