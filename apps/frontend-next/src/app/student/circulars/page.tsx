"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, readCircularsByClassSection } from '../../teacher/data'

const BANNER_COLORS = ['blue','green','orange','pink','violet'] as const
type BannerColor = typeof BANNER_COLORS[number]
function pickColor(title: string, idx: number): BannerColor {
  const sum = Array.from(title || '').reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return BANNER_COLORS[(sum + idx) % BANNER_COLORS.length]
}

export default function CircularsPage() {
  const pathname = usePathname()
  const [items, setItems] = React.useState<Array<any>>([])

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/progress', label: 'Progress', icon: '📊' },
    { href: '/student/attendance', label: 'Attendance', icon: '✅' },
    { href: '/student/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/student/calendar', label: 'Calendar', icon: '📅' },
    { href: '/student/circulars', label: 'Circulars', icon: '📣' },
    { href: '/student/syllabus', label: 'Academic Syllabus', icon: '📘' }
  ]

  const recompute = React.useCallback(() => {
    try {
      const sraw = sessionStorage.getItem('student')
      if (!sraw) return
      const { roll } = JSON.parse(sraw)
      const me = findStudent(roll)
      if (!me) return
      const arr = readCircularsByClassSection(me.klass, me.section)
      setItems(arr.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0)))
    } catch {}
  }, [])

  React.useEffect(() => {
    recompute()
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:circulars') recompute() }
    const onBus = (e: Event) => {
      try { const detail = (e as CustomEvent).detail; if (!detail || !detail.key || detail.key === 'school:circulars') recompute() } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [recompute])

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
            <h2 className="title">Circulars</h2>
            <p className="subtitle">Latest announcements and notices for your class.</p>
            <div style={{display:'grid', gap:12, marginTop:12}}>
        {items.length === 0 && (
          <div className="note">No circulars posted yet.</div>
        )}
        {items.map((c: any, i: number) => {
          const color: BannerColor = pickColor(c.title || '', i)
          return (
          <div key={i} style={{border:'1px solid var(--panel-border)', borderRadius:12, overflow:'hidden', background:'var(--panel)'}}>
            <div className={`banner-${color}`} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'12px 14px', borderBottom:'1px solid var(--panel-border)'}}>
              <div>
                <div style={{fontWeight:800}}>{c.title}</div>
                <small>{c.date} • {c.createdBy ? `By ${c.createdBy}` : ''}</small>
              </div>
              <span className="diary-lock">Read only</span>
            </div>
            <div className="paper-view">{c.body}</div>
            {Array.isArray(c.attachments) && c.attachments.length > 0 && (
              <div style={{display:'grid', gap:6, padding:'10px 14px'}}>
                {c.attachments.map((a: any, j: number) => (
                  <div key={j} style={{display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px dashed var(--panel-border)', borderRadius:10, padding:'8px 10px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                      <span style={{fontWeight:600, overflow:'hidden', textOverflow:'ellipsis'}}>{a.type === 'link' ? a.url : a.name}</span>
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
          </div>
        )})}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
