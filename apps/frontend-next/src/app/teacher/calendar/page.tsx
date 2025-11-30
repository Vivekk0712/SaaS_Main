"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getClasses,
  getSectionsForClass,
  addCalendarEvent,
  readCalendarByMonth,
} from '../data'

type CalendarItem = {
  date: string
  title: string
  tag: string
  color: string
  description?: string
  createdBy: string
  klass?: string
  section?: string
}

export default function TeacherCalendarPage() {
  const router = useRouter()
  const [teacherName, setTeacherName] = React.useState<string>('Teacher')

  const [calDate, setCalDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [calEndDate, setCalEndDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [calTag, setCalTag] = React.useState('EVENT')
  const [calTitle, setCalTitle] = React.useState('')
  const [calDesc, setCalDesc] = React.useState('')
  const [calMonth, setCalMonth] = React.useState<string>(() => new Date().toISOString().slice(0, 7))
  const [calScopeClass, setCalScopeClass] = React.useState<string>('')
  const [calScopeSection, setCalScopeSection] = React.useState<string>('')
  const [calList, setCalList] = React.useState<CalendarItem[]>([])
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (raw) {
        const t = JSON.parse(raw)
        if (t?.name) setTeacherName(String(t.name))
      }
    } catch {
      // ignore
    }
  }, [])

  const refreshCalList = React.useCallback(() => {
    try {
      const items = readCalendarByMonth(calMonth)
      setCalList(Array.isArray(items) ? (items as any) : [])
    } catch {
      setCalList([])
    }
  }, [calMonth])

  React.useEffect(() => {
    refreshCalList()
  }, [refreshCalList])

  const nextDay = (ymd: string) => {
    const d = new Date(ymd)
    d.setDate(d.getDate() + 1)
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }

  const combinedCalList = React.useMemo(() => {
    if (!calList.length) return []
    const sorted = [...calList].sort((a, b) => {
      if (a.title !== b.title) return a.title.localeCompare(b.title)
      if (a.tag !== b.tag) return a.tag.localeCompare(b.tag)
      if (a.color !== b.color) return a.color.localeCompare(b.color)
      if ((a.klass || '') !== (b.klass || '')) return (a.klass || '').localeCompare(b.klass || '')
      if ((a.section || '') !== (b.section || '')) return (a.section || '').localeCompare(b.section || '')
      return a.date.localeCompare(b.date)
    })
    const out: Array<{
      title: string
      tag: string
      color: string
      start: string
      end: string
      description?: string
      createdBy: string
      klass?: string
      section?: string
    }> = []
    let current: any = null
    const pushCurrent = () => {
      if (current) out.push(current)
      current = null
    }
    for (const ev of sorted) {
      const key =
        `${ev.title}||${ev.tag}||${ev.color}||${ev.klass || ''}||${ev.section || ''}||${ev.createdBy || ''}`
      const curKey = current
        ? `${current.title}||${current.tag}||${current.color}||${current.klass || ''}||${current.section || ''}||${current.createdBy || ''}`
        : null
      if (
        !current ||
        key !== curKey ||
        ev.date > current.end ||
        ev.date < current.start ||
        (ev.date > current.end && ev.date !== nextDay(current.end))
      ) {
        pushCurrent()
        current = {
          title: ev.title,
          tag: ev.tag,
          color: ev.color,
          start: ev.date,
          end: ev.date,
          description: ev.description,
          createdBy: ev.createdBy,
          klass: ev.klass,
          section: ev.section,
        }
      } else {
        if (ev.date < current.start) current.start = ev.date
        if (ev.date > current.end) current.end = ev.date
        if (!current.description && ev.description) current.description = ev.description
      }
    }
    pushCurrent()
    return out
  }, [calList])

  const onAddCalendarEvent = () => {
    if (!calTitle.trim()) {
      setMessage('Enter event title')
      setTimeout(() => setMessage(''), 1200)
      return
    }
    const tag = (calTag || 'EVENT').trim()
    const upper = tag.toUpperCase()
    const color: 'blue' | 'green' | 'orange' =
      upper.includes('PTM') ? 'blue' : upper.includes('HOLIDAY') ? 'orange' : 'green'
    const start = new Date(calDate)
    const end = new Date(calEndDate || calDate)
    if (end < start) end.setTime(start.getTime())
    const days: string[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const m = (cursor.getMonth() + 1).toString().padStart(2, '0')
      const d = cursor.getDate().toString().padStart(2, '0')
      days.push(`${cursor.getFullYear()}-${m}-${d}`)
      cursor.setDate(cursor.getDate() + 1)
    }
    days.forEach(d => {
      const payload: any = {
        date: d,
        title: calTitle.trim(),
        tag,
        color,
        description: calDesc.trim(),
        createdBy: teacherName,
      }
      if (calScopeClass) {
        payload.klass = calScopeClass
        if (calScopeSection) payload.section = calScopeSection
      }
      addCalendarEvent(payload)
    })
    setMessage('Calendar event added.')
    setCalDesc('')
    setCalTitle('')
    refreshCalList()
  }

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Teacher</strong>
          </div>
          <nav className="tabs" aria-label="Teacher navigation">
            <Link className="tab" href="/teacher/dashboard">
              Dashboard
            </Link>
            <Link className="tab" href="/teacher/academic-content">
              Academic Content
            </Link>
            <Link className="tab" href="/teacher/circulars">
              Circulars
            </Link>
            <Link className="tab" href="/teacher/marks">
              Marks Entry
            </Link>
            <span className="tab tab-active">Academic Calendar</span>
          </nav>
        </div>
      </div>

      <div className="dash-wrap">
        <div className="dash">
          <h2 className="title">Academic Calendar</h2>
          <p className="subtitle">
            Add PTMs, holidays, and events for the whole school or specific classes/sections and see
            them grouped by date range.
          </p>

          <div className="grid">
            <section className="cal" aria-label="Academic calendar events">
              <div className="cal-head">
                <div className="cal-title">Academic Calendar — Add Event</div>
              </div>
              <div style={{ display: 'grid', gap: 10, padding: 18 }}>
                <div className="row">
                  <input
                    className="input"
                    type="date"
                    value={calDate}
                    onChange={e => {
                      setCalDate(e.target.value)
                      setCalMonth(e.target.value.slice(0, 7))
                      if (!calEndDate) setCalEndDate(e.target.value)
                    }}
                  />
                  <input
                    className="input"
                    type="date"
                    value={calEndDate}
                    onChange={e => setCalEndDate(e.target.value)}
                  />
                  <select
                    className="input select"
                    value={calTag}
                    onChange={e => setCalTag(e.target.value)}
                  >
                    <option value="PTM">PTM</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div className="row">
                  <select
                    className="input select"
                    value={calScopeClass}
                    onChange={e => {
                      setCalScopeClass(e.target.value)
                      setCalScopeSection('')
                    }}
                  >
                    <option value="">Whole School</option>
                    {getClasses().map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input select"
                    value={calScopeSection}
                    onChange={e => setCalScopeSection(e.target.value)}
                    disabled={!calScopeClass}
                  >
                    <option value="">All Sections</option>
                    {(calScopeClass ? getSectionsForClass(calScopeClass) : []).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="input"
                  value={calTitle}
                  onChange={e => setCalTitle(e.target.value)}
                  placeholder="Event title"
                />
                <textarea
                  className="paper"
                  style={{ minHeight: 100 }}
                  placeholder="Event description (optional)"
                  value={calDesc}
                  onChange={e => setCalDesc(e.target.value)}
                />
                <div className="actions">
                  <button className="btn" type="button" onClick={onAddCalendarEvent}>
                    Add Event
                  </button>
                </div>
                {message && <div className="profile-message">{message}</div>}
              </div>
            </section>

            <aside
              className="events"
              id="teacher-calendar-events"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              <div className="events-head">Events in {calMonth}</div>
              <div className="note-list">
                {combinedCalList.length === 0 && (
                  <div className="note-card note-blue">No events saved for this month.</div>
                )}
                {combinedCalList.map((e, idx) => (
                  <div key={idx} className={`note-card note-${e.color}`}>
                    <div className="note-chip">{e.tag}</div>
                    <div className="note-title">{e.title}</div>
                    <small>{e.start === e.end ? e.start : `${e.start} → ${e.end}`}</small>
                    {e.description && <p>{e.description}</p>}
                    <small>
                      By {e.createdBy}
                      {e.klass && ` • ${e.klass}`}
                      {e.section && ` ${e.section}`}
                    </small>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="dash" style={{ marginTop: 24 }}>
            <Link className="back" href="/teacher/dashboard">
              &larr; Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
