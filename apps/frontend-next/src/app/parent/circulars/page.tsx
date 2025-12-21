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

export default function ParentCircularsPage() {
  const pathname = usePathname()
  const [items, setItems] = React.useState<Array<any>>([])
  const [showFilter, setShowFilter] = React.useState(false)
  const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'week' | 'month' | 'date'>('all')
  const [dateFilterValue, setDateFilterValue] = React.useState<string>('')

  const recompute = React.useCallback(() => {
    try {
      const raw = sessionStorage.getItem('parent')
      if (!raw) return
      const { roll } = JSON.parse(raw)
      if (!roll) return
      const me = findStudent(String(roll))
      if (!me) return
      const arr = readCircularsByClassSection(me.klass, me.section as 'A' | 'B')
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

  const filteredItems = React.useMemo(() => {
    if (!items.length) return []
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const startOfWeek = new Date(startOfToday)
    const weekday = (startOfWeek.getDay() + 6) % 7 // Monday=0
    startOfWeek.setDate(startOfWeek.getDate() - weekday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    let customStart: Date | null = null
    let customEnd: Date | null = null
    if (dateFilter === 'date' && dateFilterValue) {
      const d = new Date(dateFilterValue)
      if (!Number.isNaN(d.getTime())) {
        customStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        customEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      }
    }

    const inRange = (c: any) => {
      if (dateFilter === 'all') return true
      let dt: Date | null = null
      if (typeof c.ts === 'number') {
        dt = new Date(c.ts)
      } else if (c.date) {
        const parsed = new Date(c.date)
        if (!Number.isNaN(parsed.getTime())) dt = parsed
      }
      if (!dt) return true
      const ms = dt.getTime()

      switch (dateFilter) {
        case 'today':
          return ms >= startOfToday.getTime() && ms <= endOfToday.getTime()
        case 'week':
          return ms >= startOfWeek.getTime() && ms <= endOfWeek.getTime()
        case 'month':
          return ms >= startOfMonth.getTime() && ms <= endOfMonth.getTime()
        case 'date':
          if (!customStart || !customEnd) return true
          return ms >= customStart.getTime() && ms <= customEnd.getTime()
        default:
          return true
      }
    }

    return items.filter(inRange)
  }, [items, dateFilter, dateFilterValue])

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h2 className="title">Circulars</h2>
                <p className="subtitle">Latest announcements and notices for your child&apos;s class.</p>
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{
                  fontSize: 12,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid #ea580c',
                  background: showFilter ? '#ea580c' : '#fff7ed',
                  color: showFilter ? '#ffffff' : '#9a3412',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setShowFilter(true)}
              >
                Filter
              </button>
            </div>
      <div style={{display:'grid', gap:12, marginTop:12}}>
        {items.length === 0 && (
          <div className="note">No circulars posted yet.</div>
        )}
        {items.length > 0 && filteredItems.length === 0 && (
          <div className="note">No circulars in this time range.</div>
        )}
        {filteredItems.map((c: any, i: number) => {
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
          )
        })}
      </div>
          </div>
        </div>
      </div>
      {showFilter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            zIndex: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '90vh',
              background: '#ffffff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: '0 -20px 40px rgba(15,23,42,0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15 }}>Circular filters</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setDateFilter('all')
                    setDateFilterValue('')
                  }}
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowFilter(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '200px minmax(0,1fr)',
                gap: 16,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  ['all', 'All circulars'],
                  ['today', 'Today'],
                  ['week', 'This week'],
                  ['month', 'This month'],
                  ['date', 'Select a date'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="btn-ghost"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: dateFilter === key ? '#eff6ff' : 'transparent',
                      fontWeight: dateFilter === key ? 600 : 500,
                    }}
                    onClick={() => setDateFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div>
                {dateFilter === 'all' && (
                  <p className="note">
                    Showing every circular for this class and section.
                  </p>
                )}
                {dateFilter === 'today' && (
                  <p className="note">
                    Only circulars posted today are shown.
                  </p>
                )}
                {dateFilter === 'week' && (
                  <p className="note">
                    Circulars from the current Monday through Sunday.
                  </p>
                )}
                {dateFilter === 'month' && (
                  <p className="note">
                    Circulars from this calendar month.
                  </p>
                )}
                {dateFilter === 'date' && (
                  <div style={{ display: 'grid', gap: 10, maxWidth: 260 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>On date</div>
                      <input
                        className="input"
                        type="date"
                        value={dateFilterValue}
                        onChange={(e) => setDateFilterValue(e.target.value)}
                      />
                    </div>
                    <p className="note">
                      Show circulars posted on the selected date.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
              }}
            >
              <div>
                <strong>{filteredItems.length}</strong> circular
                {filteredItems.length === 1 ? '' : 's'} in view
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '6px 18px', borderRadius: 999 }}
                onClick={() => setShowFilter(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        className="parent-logout-fab"
        onClick={() => {
          try {
            sessionStorage.removeItem('parent')
          } catch {}
          try {
            window.location.href = '/'
          } catch {}
        }}
        aria-label="Logout"
      >
        ⏻
      </button>
      <span className="parent-logout-label">Logout</span>
    </div>
  )
}
