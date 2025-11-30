"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, readCalendarByMonth } from '../../teacher/data'

type EventColor = 'blue' | 'green' | 'orange'

type Event = { date: string; title: string; color: EventColor; description: string; tag: string }

function getMonthMatrix(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // start on Monday
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function formatYMD(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

function ymOf(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}

function formatDMYFromYMD(ymd: string) {
  const y = ymd.slice(0, 4)
  const m = ymd.slice(5, 7)
  const d = ymd.slice(8, 10)
  return `${d}/${m}/${y}`
}

export default function ParentCalendarPage() {
  const pathname = usePathname()
  const [month, setMonth] = React.useState(() => new Date())
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)
  const [klass, setKlass] = React.useState('')
  const [section, setSection] = React.useState<'A' | 'B' | ''>('')
  const [events, setEvents] = React.useState<Event[]>([])

  const days = React.useMemo(() => getMonthMatrix(month), [month])
  const isSameMonth = (d: Date) => d.getMonth() === month.getMonth()
  const isToday = (d: Date) => {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }
  const monthStr = `${MONTHS[month.getMonth()]} ${month.getFullYear()}`

  const isMobile = (typeof window !== 'undefined' && window.matchMedia)
    ? window.matchMedia('(max-width: 640px)').matches
    : false

  // Resolve child's class/section from parent session
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('parent')
      if (!raw) return
      const sess = JSON.parse(raw)
      const roll = String(sess.roll || '')
      if (roll) {
        const me = findStudent(roll)
        if (me) {
          setKlass(me.klass)
          setSection(me.section as any)
        }
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    const loadCal = () => {
      try {
        const items = readCalendarByMonth(ymOf(month), klass || undefined, section || undefined)
        const mapped: Event[] = items.map(ev => ({
          date: ev.date,
          title: ev.title,
          color: ev.color as EventColor,
          description: ev.description,
          tag: ev.tag
        }))
        setEvents(mapped)
      } catch {
        setEvents([])
      }
    }
    loadCal()
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:calendar') loadCal() }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key || key === 'school:calendar') loadCal()
      } catch {
        loadCal()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [month, klass, section])

  const eventsThisMonth = React.useMemo(
    () => events.filter(e => e.date.slice(0, 7) === ymOf(month)),
    [events, month]
  )

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

          <div className="dash dash-wide">
            <div
              style={{
                height: 6,
                width: 64,
                borderRadius: 999,
                background: '#3b2c1a',
                marginBottom: 10,
              }}
            />
            <h2 className="title">Academic Calendar</h2>
            <p className="subtitle">Events, exams, and key dates for your child.</p>

      <div className="grid" style={{ marginTop: 12, gridTemplateColumns:'minmax(0,2.1fr) minmax(0,1.2fr)', alignItems:'start', gap:16 }}>
        <section className="cal" aria-label="Academic calendar">
          <div className="cal-head">
            <button className="btn-ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
              Prev
            </button>
            <div className="cal-title">{monthStr}</div>
            <button className="btn-ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
              Next
            </button>
          </div>
          <div className="cal-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="cal-dow">
                {d}
              </div>
            ))}
            {days.map((d, index) => {
              const ymd = formatYMD(d)
              const dots = events.filter(e => e.date === ymd)
              const primaryColor = dots[0]?.color
              const isSelected = selectedDay === ymd
              const showEventPills = dots.length > 0 && (!isMobile || !isSelected)
              const showEventLine = dots.length > 0 && isMobile && isSelected
              const eventLine = showEventLine ? dots.map(e => e.tag.toUpperCase()).join(' • ') : ''
              return (
                <div
                  key={index}
                  className={`cal-day ${isSameMonth(d) ? '' : 'cal-out'} ${isToday(d) ? 'cal-today' : ''} ${
                    dots.length ? 'cal-has-event' : ''
                  } ${isSelected ? 'cal-selected' : ''}`}
                  data-eventcolor={primaryColor || undefined}
                  role={isMobile ? 'button' : undefined}
                  aria-pressed={isMobile ? isSelected : undefined}
                  onClick={() => {
                    if (!isMobile) return
                    if (!dots.length) return setSelectedDay(null)
                    setSelectedDay(prev => (prev === ymd ? null : ymd))
                  }}
                >
                  <div className="cal-num">{d.getDate()}</div>
                  <div className="event-dots">
                    {dots.map((e, idx) => (
                      <span key={idx} className={`event-dot dot-${e.color}`} title={e.title} />
                    ))}
                  </div>
                  {showEventPills && (
                    <div className="event-pills">
                      {dots.map((e, idx) => (
                        <span key={idx} className={`event-pill pill-${e.color}`} title={e.description}>
                          {e.tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {showEventLine && (
                    <div className="event-line" title={eventLine}>
                      {eventLine}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="cal-mini">
            <span style={{ marginRight: 12 }}>
              <span className="legend-dot" style={{ background: 'var(--blue)', marginRight: 4 }} />
              PTM
            </span>
            <span style={{ marginRight: 12 }}>
              <span className="legend-dot" style={{ background: 'var(--orange)', marginRight: 4 }} />
              Holiday
            </span>
            <span>
              <span className="legend-dot" style={{ background: 'var(--green)', marginRight: 4 }} />
              Event
            </span>
          </div>
        </section>

        <aside className="events">
          <div className="events-head">Events in {MONTHS[month.getMonth()]}</div>
          <div className="note-list" style={{ maxHeight: 480, minHeight: 320, overflowY: 'auto' }}>
            {eventsThisMonth.length === 0 && <div className="note-card note-blue">No events planned this month.</div>}
            {eventsThisMonth.map((e, idx) => (
              <div key={idx} className={`note-card note-${e.color}`}>
                <div className="note-chip">{e.tag}</div>
                <div className="note-title">{e.title}</div>
                <small>{formatDMYFromYMD(e.date)}</small>
                <p>{e.description}</p>
              </div>
            ))}
          </div>
        </aside>
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
