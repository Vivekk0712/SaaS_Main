"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, getSubjects, subjectForHourFor } from '../../teacher/data'
import { BarChart, type LineSeries } from '../../components/LineChart'
import { subjectColor, type ColorTag } from '../../lib/colors'

type LogEntry = { date: string; hour: number; status: 'Present' | 'Absent' | 'Leave'; topic?: string }
type SubjectStats = { total: number; present: number; absent: number; logs: LogEntry[] }
type DailySummary = {
  date: string
  total: number
  present: number
  absent: number
  leave: number
  items: Array<{ hour: number; status: 'Present' | 'Absent' | 'Leave' }>
}

type MonthlySummary = {
  monthKey: string
  label: string
  present: number
  absent: number
  leave: number
  total: number
}

type DayStatus = 'present' | 'absent' | 'leave' | 'none'

type MonthCalendarView = {
  monthKey: string
  label: string
  weeks: Array<Array<{ day: number | null; status: DayStatus }>>
}

function parseAttendance() {
  const raw = localStorage.getItem('school:attendance')
  return raw ? JSON.parse(raw) : {}
}

function parseTopics() {
  const raw = localStorage.getItem('school:attendanceTopics')
  return raw ? (JSON.parse(raw) as Record<string, string>) : {}
}

function formatDMY(ymd: string) {
  return `${ymd.slice(8,10)}/${ymd.slice(5,7)}/${ymd.slice(0,4)}`
}

function formatMonthLabelFromKey(key: string) {
  const [yearStr, monthStr] = key.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const dt = new Date(year, monthIndex, 1)
  const short = dt.toLocaleString('en', { month: 'short' }).toUpperCase()
  return `${short}, ${String(year).slice(-2)}`
}

function buildMonthlyFromDaily(daily: Record<string, DailySummary>): MonthlySummary[] {
  const map: Record<string, MonthlySummary> = {}
  for (const day of Object.values(daily)) {
    const monthKey = day.date.slice(0, 7)
    if (!monthKey) continue
    const existing = map[monthKey] || {
      monthKey,
      label: formatMonthLabelFromKey(monthKey),
      present: 0,
      absent: 0,
      leave: 0,
      total: 0,
    }
    existing.present += day.present
    existing.absent += day.absent
    existing.leave += day.leave
    existing.total += day.total
    map[monthKey] = existing
  }
  return Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

function computeAnnualTotals(months: MonthlySummary[]) {
  return months.reduce(
    (acc, m) => ({
      present: acc.present + m.present,
      absent: acc.absent + m.absent,
      leave: acc.leave + m.leave,
      total: acc.total + m.total,
    }),
    { present: 0, absent: 0, leave: 0, total: 0 },
  )
}

function buildCalendarFromDaily(daily: Record<string, DailySummary>, maxMonths = 12): MonthCalendarView[] {
  const byMonth: Record<string, { label: string; days: Record<number, DayStatus> }> = {}
  for (const day of Object.values(daily)) {
    const monthKey = day.date.slice(0, 7)
    if (!monthKey) continue
    const label = formatMonthLabelFromKey(monthKey)
    const bucket = (byMonth[monthKey] ||= { label, days: {} })
    const dom = Number(day.date.slice(8, 10))
    let status: DayStatus
    if (day.leave > 0 && day.present === 0 && day.absent === 0) {
      status = 'leave'
    } else if (day.present === 0 && day.absent === 0) {
      status = 'none'
    } else {
      if (day.present >= day.absent && day.present > 0) status = 'present'
      else if (day.absent > day.present) status = 'absent'
      else status = 'none'
    }
    bucket.days[dom] = status
  }
  const keys = Object.keys(byMonth)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, maxMonths)
  return keys.map((key) => {
    const { label, days } = byMonth[key]
    const [yearStr, monthStr] = key.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1
    const first = new Date(year, monthIndex, 1)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const startOffset = (first.getDay() + 6) % 7 // Monday as first column
    const cells: Array<{ day: number | null; status: DayStatus }> = []
    for (let i = 0; i < startOffset; i++) cells.push({ day: null, status: 'none' })
    for (let d = 1; d <= daysInMonth; d++) {
      const status = days[d] || 'none'
      cells.push({ day: d, status })
    }
    const weeks: MonthCalendarView['weeks'] = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    return { monthKey: key, label, weeks }
  })
}

function AttendanceDonut({ present, absent, leave }: { present: number; absent: number; leave: number }) {
  const total = present + absent + leave
  if (!total) {
    return <div className="note" style={{ fontSize: 12 }}>No attendance recorded yet.</div>
  }
  const values = [present, absent, leave]
  const colors = ['#22c55e', '#ef4444', '#f97316']
  const labels = ['Present', 'Absent', 'Leave']
  const r = 32
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Annual attendance split">
        <g transform="translate(60,60)">
          <circle r={r} cx={0} cy={0} fill="none" stroke="#e5e7eb" strokeWidth={12} />
          {values.map((v, i) => {
            if (!v) return null
            const frac = v / total
            const len = c * frac
            const dash = `${len} ${c - len}`
            const node = (
              <circle
                key={labels[i]}
                r={r}
                cx={0}
                cy={0}
                fill="none"
                stroke={colors[i]}
                strokeWidth={12}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            )
            offset += len
            return node
          })}
        </g>
      </svg>
      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {values.map((v, i) => {
          if (!v) return null
          const pct = total ? Math.round((v * 100) / total) : 0
          return (
            <div key={labels[i]} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: colors[i] }} />
              <span>{labels[i]} — {pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ParentAttendancePage() {
  const pathname = usePathname()
  const [stats, setStats] = React.useState<Record<string, SubjectStats>>(() => ({}))
  const [open, setOpen] = React.useState<Record<string, boolean>>(() => ({}))
  const [subjects, setSubjects] = React.useState<string[]>([])
  const [mounted, setMounted] = React.useState(false)
  const [daily, setDaily] = React.useState<Record<string, DailySummary>>(() => ({}))
  const [calendarFilter, setCalendarFilter] = React.useState<string | 'all'>('all')
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)

  const recompute = React.useCallback(() => {
    try {
      const sraw = sessionStorage.getItem('parent')
      if (!sraw) return
      const { roll } = JSON.parse(sraw)
      const me = findStudent(roll)
      if (!me) return
      const store = parseAttendance() as Record<string, Record<string, any>>
      const topicStore = parseTopics()
      const init: Record<string, SubjectStats> = {}
      const dailyMap: Record<string, DailySummary> = {}

      for (const k of Object.keys(store)) {
        const parts = k.split('|')
        if (parts.length < 4) continue
        const [date, klass, section, hourStr] = parts
        if (klass !== me.klass || section !== me.section) continue
        const hour = Number(hourStr)
        const slot = store[k] || {}
        const subjStored =
          slot && typeof slot === 'object' && 'subject' in (slot as any)
            ? String((slot as any).subject || '')
            : ''
        const subj = subjStored || subjectForHourFor(me.klass, me.section, hour)
        const subjKey = String(subj || 'Subject')
        const m =
          slot && typeof slot === 'object' && 'map' in (slot as any) && (slot as any).map
            ? (slot as any).map
            : slot || {}
        if (!(me.usn in m)) continue
        const raw = m[me.usn]
        let status: LogEntry['status']
        if (raw === true || raw === 'P') status = 'Present'
        else if (raw === 'L') status = 'Leave'
        else status = 'Absent'

        const topic = topicStore[k] || ''
        const bucket = (init[subjKey] ||= { total: 0, present: 0, absent: 0, logs: [] })
        bucket.total += 1
        if (status === 'Present') bucket.present += 1
        else bucket.absent += 1
        bucket.logs.push({ date, hour, status, topic: topic || undefined })

        const day = (dailyMap[date] ||= { date, total: 0, present: 0, absent: 0, leave: 0, items: [] })
        day.total += 1
        if (status === 'Present') day.present += 1
        else if (status === 'Leave') day.leave += 1
        else day.absent += 1
        day.items.push({ hour, status })
      }

      for (const s of Object.keys(init)) {
        init[s].logs.sort((a,b) => {
          const ak = `${a.date}-${String(a.hour).padStart(2,'0')}`
          const bk = `${b.date}-${String(b.hour).padStart(2,'0')}`
          return bk.localeCompare(ak)
        })
      }
      setStats(init)
      for (const key of Object.keys(dailyMap)) {
        dailyMap[key].items.sort((a, b) => a.hour - b.hour)
      }
      setDaily(dailyMap)
    } catch {}
  }, [])

  React.useEffect(() => {
    setMounted(true)
    setSubjects(getSubjects())
    recompute()
    const onStorage = (e: StorageEvent) => { 
      if (e.key === 'school:attendance' || e.key === 'school:attendanceTopics') recompute()
      if (e.key === 'school:subjects' || e.key === 'school:classSubjects') setSubjects(getSubjects())
    }
    const onBus = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail || {}
        if (!detail || !detail.key) { recompute(); return }
        if (detail.key === 'school:attendance' || detail.key === 'school:attendanceTopics') recompute()
        if (detail.key === 'school:subjects' || detail.key === 'school:classSubjects') setSubjects(getSubjects())
      } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [recompute])

  const monthly = buildMonthlyFromDaily(daily)
  const annual = computeAnnualTotals(monthly)
  const maxMonthlyTotal = monthly.length ? Math.max(...monthly.map(m => m.total)) : 0
  const yMaxMonthly = Math.max(5, Math.ceil(maxMonthlyTotal / 5) * 5)
  const yTicksMonthly = Array.from({ length: Math.floor(yMaxMonthly / 5) + 1 }, (_, i) => i * 5)
  const [monthlyIndex, setMonthlyIndex] = React.useState(0)
  React.useEffect(() => {
    if (!monthly.length) {
      setMonthlyIndex(0)
      return
    }
    setMonthlyIndex(prev => {
      if (prev < 0 || prev >= monthly.length) return monthly.length - 1
      return prev
    })
  }, [monthly.length])
  const monthlyVisible = monthly.length ? [monthly[monthlyIndex]] : []
  const calendarMonths = buildCalendarFromDaily(daily)
  const sortedMonths = [...calendarMonths].sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  const monthKeys = sortedMonths.map(m => m.monthKey)
  const activeMonthKey = calendarFilter === 'all'
    ? (monthKeys[monthKeys.length - 1] || null)
    : calendarFilter
  const activeIndex = activeMonthKey ? monthKeys.indexOf(activeMonthKey) : -1
  const activeMonth = activeMonthKey
    ? sortedMonths.find(m => m.monthKey === activeMonthKey) || null
    : null

  React.useEffect(() => {
    if (selectedDay) return
    const keys = Object.keys(daily)
    if (!keys.length) return
    const latest = keys.sort((a, b) => b.localeCompare(a))[0]
    setSelectedDay(latest)
  }, [daily, selectedDay])

  if (!mounted) return null

  const attendancePct = annual.total ? Math.round((annual.present * 100) / annual.total) : null
  const daysRecorded = Object.keys(daily).length
  const daysPresent = Object.values(daily).filter(d => d.present > 0).length

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
            <h2 className="title">Attendance</h2>
            <p className="subtitle">Subject-wise summary plus monthly charts and detailed logs for your child.</p>

      {/* Summary strip */}
            <div
        style={{
          marginTop: 10,
          marginBottom: 8,
          background: '#1f1a24',
          borderRadius: 24,
          padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
          gap: 16,
          color: '#f9f5ff',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 14,
              background: '#26202b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ✅
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Attendance</div>
            <div style={{ fontWeight: 800, fontSize: 18 }} suppressHydrationWarning>
              {attendancePct != null ? `${attendancePct}%` : '--'}
            </div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>of periods marked present</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 14,
              background: '#26202b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            📅
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Active days</div>
            <div style={{ fontWeight: 800, fontSize: 18 }} suppressHydrationWarning>
              {daysRecorded}
            </div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>days with at least one class</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 14,
              background: '#26202b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            🌟
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Present days</div>
            <div style={{ fontWeight: 800, fontSize: 18 }} suppressHydrationWarning>
              {daysPresent}
            </div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>days with at least one present</div>
          </div>
        </div>
      </div>

      {monthly.length > 0 && (
        <div style={{ display: 'grid', gap: 12, marginTop: 12, gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1.1fr)' }}>
          <div className="card" style={{ padding: '12px 14px', borderRadius: 16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>Monthly attendance</div>
              {monthly.length > 1 && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding:'2px 6px', borderRadius:999, opacity: monthlyIndex > 0 ? 1 : 0.4 }}
                    disabled={monthlyIndex <= 0}
                    onClick={() => setMonthlyIndex(i => Math.max(0, i - 1))}
                  >
                    ◀
                  </button>
                  <span style={{ fontWeight:600 }}>
                    {monthly[monthlyIndex]?.label || 'Month'}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding:'2px 6px', borderRadius:999, opacity: monthlyIndex < monthly.length - 1 ? 1 : 0.4 }}
                    disabled={monthlyIndex >= monthly.length - 1}
                    onClick={() => setMonthlyIndex(i => Math.min(monthly.length - 1, i + 1))}
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
            <BarChart
              title="Attendance by month (periods)"
              categories={monthlyVisible.map((m) => m.label)}
              series={[
                { name: 'Present', color: '#16a34a', data: monthlyVisible.map((m) => m.present) } as LineSeries,
                { name: 'Absent', color: '#ef4444', data: monthlyVisible.map((m) => m.absent) } as LineSeries,
                { name: 'Leave', color: '#f97316', data: monthlyVisible.map((m) => m.leave) } as LineSeries,
              ]}
              height={220}
              yMax={yMaxMonthly}
              yTicks={yTicksMonthly}
            />
          </div>
          <div className="card" style={{ padding: '12px 14px', borderRadius: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Annual attendance details</div>
            <AttendanceDonut present={annual.present} absent={annual.absent} leave={annual.leave} />
          </div>
        </div>
      )}

      {calendarMonths.length > 0 && activeMonth && (
        <div className="card" style={{ marginTop: 12, padding: '12px 14px', borderRadius: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Monthly attendance calendar</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
            Colored dots show days marked present, absent, or on partial leave.
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, fontSize:11}}>
            <button
              type="button"
              className="btn-ghost"
              disabled={activeIndex <= 0}
              style={{ padding:'2px 10px', borderRadius:999, opacity: activeIndex > 0 ? 1 : 0.4 }}
              onClick={() => {
                if (activeIndex <= 0) return
                setCalendarFilter(sortedMonths[activeIndex - 1].monthKey)
              }}
            >
              ◀
            </button>
            <div style={{fontWeight:600}}>{activeMonth.label}</div>
            <button
              type="button"
              className="btn-ghost"
              disabled={activeIndex === -1 || activeIndex >= sortedMonths.length - 1}
              style={{ padding:'2px 10px', borderRadius:999, opacity: activeIndex >= 0 && activeIndex < sortedMonths.length - 1 ? 1 : 0.4 }}
              onClick={() => {
                if (activeIndex === -1 || activeIndex >= sortedMonths.length - 1) return
                setCalendarFilter(sortedMonths[activeIndex + 1].monthKey)
              }}
            >
              ▶
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', justifyItems:'center' }}>
            <div style={{ width: '100%', maxWidth: 320, aspectRatio: '1 / 1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textAlign: 'center' }}>
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <div key={d} style={{ opacity: 0.7, fontSize: 12 }}>{d}</div>
                ))}
                {activeMonth.weeks.flat().map((cell, idx) => {
                  if (!cell.day) {
                    return <div key={idx} />
                  }
                  let eventColor: string | undefined
                  if (cell.status === 'present') eventColor = 'green'
                  else if (cell.status === 'absent') eventColor = 'red'
                  else if (cell.status === 'leave') eventColor = 'orange'
                  return (
                    <div
                      key={idx}
                      className={`cal-day${eventColor ? ' cal-has-event' : ''}`}
                      data-eventcolor={eventColor}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 700,
                        minHeight: 0,
                        padding: 6,
                      }}
                    >
                      {cell.day}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, display: 'flex', gap: 12 }}>
            <span><span style={{ width: 8, height: 8, borderRadius: 999, background: '#16a34a', display: 'inline-block', marginRight: 4 }} />Present</span>
            <span><span style={{ width: 8, height: 8, borderRadius: 999, background: '#ef4444', display: 'inline-block', marginRight: 4 }} />Absent</span>
            <span><span style={{ width: 8, height: 8, borderRadius: 999, background: '#f97316', display: 'inline-block', marginRight: 4 }} />Leave</span>
          </div>
        </div>
      )}

      <div style={{display:'grid', gap:12, marginTop:16, gridTemplateColumns:'minmax(0, 2.1fr) minmax(0, 1.3fr)'}}>
        <div style={{display:'grid', gap:12}}>
          {(subjects.length ? subjects : Object.keys(stats)).map((sub) => {
            const key = String(sub)
            const s = stats[key] || { total: 0, present: 0, absent: 0, logs: [] }
            const pct = s.total ? Math.round((s.present * 100) / s.total) : 0
            const opened = !!open[key]
            const tag: ColorTag = subjectColor(key) as ColorTag
            return (
              <div key={sub} className="subject-card">
                <div className={`subject-header banner-${tag}`} style={{display:'grid', gridTemplateColumns:'2fr repeat(4,1fr)', gap:8, alignItems:'center', padding:'12px 14px', borderBottom: opened ? '1px solid var(--panel-border)' : 'none'}}>
                  <div style={{fontWeight:800, fontSize:16}}>{sub}</div>
                  <div style={{textAlign:'center'}}>
                    <div className="note">Total</div>
                    <div style={{fontSize:20, fontWeight:800}}>{s.total}</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div className="note">Present</div>
                    <div style={{fontSize:20, fontWeight:800, color:'var(--success)'}}>{s.present}</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div className="note">Absent</div>
                    <div style={{fontSize:20, fontWeight:800, color:'var(--danger)'}}>{s.absent}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(prev => ({ ...prev, [sub]: !opened }))}
                    className="subject-pct"
                    title="Toggle detailed log"
                  >
                    <div className="note">Percent</div>
                    <div style={{fontSize:20, fontWeight:800}}>{pct}%</div>
                  </button>
                </div>
                {opened && (
                  <div className="subject-log">
                    <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr 2fr', gap:6, padding:'8px 10px', border:'1px solid var(--panel-border)', borderRadius:8, background:'var(--panel-soft)'}}>
                      <strong>Date</strong>
                      <strong>Period</strong>
                      <strong>Status</strong>
                      <strong>Topic</strong>
                    </div>
                    <div style={{display:'grid', gap:6, marginTop:8}}>
                      {s.logs.length === 0 && (
                        <div className="note">No classes recorded for this subject yet.</div>
                      )}
                      {s.logs.map((entry, idx) => (
                        <div key={`${entry.date}-${entry.hour}-${idx}`} style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr 2fr', gap:6, alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'8px 10px'}}>
                          <span>{formatDMY(entry.date)}</span>
                          <span>Hour {entry.hour}</span>
                          <span style={{fontWeight:700, color: entry.status === 'Present' ? 'var(--success)' : entry.status === 'Leave' ? '#f97316' : 'var(--danger)'}}>{entry.status}</span>
                          <span style={{ fontSize: 11, opacity: entry.topic ? 0.95 : 0.6 }}>
                            {entry.topic || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <div className="card" style={{ padding: '10px 12px', borderRadius: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Daily attendance snapshot</div>
            <p className="note">Use the calendar or arrows to move between days.</p>
            {Object.keys(daily).length === 0 && (
              <div className="note" style={{ marginTop: 6 }}>No attendance recorded yet. Snapshot will appear once classes are marked.</div>
            )}
            {Object.keys(daily).length > 0 && selectedDay && (() => {
              const sortedKeys = Object.keys(daily).sort((a, b) => a.localeCompare(b))
              const hasDay = !!daily[selectedDay]
              const idx = hasDay ? sortedKeys.indexOf(selectedDay) : -1
              const prevKey = idx > 0 ? sortedKeys[idx - 1] : null
              const nextKey = idx >= 0 && idx < sortedKeys.length - 1 ? sortedKeys[idx + 1] : null
              const day = hasDay ? daily[selectedDay] : null
              const allPresent = !!day && day.absent === 0 && day.leave === 0 && day.total > 0
              const bg = allPresent
                ? 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.02))'
                : 'linear-gradient(135deg, rgba(148,163,184,0.12), rgba(241,245,249,0.9))'
              const borderColor = allPresent ? 'rgba(22,163,74,0.4)' : 'rgba(148,163,184,0.7)'
              return (
                <div
                  className="card"
                  style={{
                    marginTop: 8,
                    padding:'10px 12px',
                    borderRadius:16,
                    border:`1px solid ${borderColor}`,
                    background:bg,
                    display:'flex',
                    flexDirection:'column',
                    gap:6
                  }}
                >
                  <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginBottom:2}}>
                    <span aria-hidden="true" style={{ fontSize: 12 }}>📅</span>
                    <input
                      className="input"
                      type="date"
                      style={{ maxWidth: 150, fontSize: 11, padding: '2px 6px' }}
                      value={selectedDay || ''}
                      onChange={e => setSelectedDay(e.target.value)}
                    />
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={!prevKey}
                      style={{ fontSize: 12, padding: '2px 8px', opacity: prevKey ? 1 : 0.4 }}
                      onClick={() => prevKey && setSelectedDay(prevKey)}
                    >
                      ◀
                    </button>
                    <div style={{fontWeight:700, fontSize:13}}>
                      {selectedDay ? formatDMY(selectedDay) : ''}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={!nextKey}
                      style={{ fontSize: 12, padding: '2px 8px', opacity: nextKey ? 1 : 0.4 }}
                      onClick={() => nextKey && setSelectedDay(nextKey)}
                    >
                      ▶
                    </button>
                  </div>
                  {day ? (
                    <>
                      <div style={{fontSize:12, fontWeight:600}}>
                        Present: {day.present}, Absent: {day.absent}, Leave: {day.leave}, Total: {day.total}
                      </div>
                      <div style={{ display: 'grid', gap: 4 }}>
                        {day.items.map((it, idx) => (
                          <div
                            key={`${day.date}-${it.hour}-${idx}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderRadius: 10,
                              padding: '6px 8px',
                              background:
                                it.status === 'Present'
                                  ? 'rgba(16,185,129,0.06)'
                                  : it.status === 'Leave'
                                    ? 'rgba(249,115,22,0.08)'
                                    : 'rgba(248,113,113,0.10)',
                            }}
                          >
                            <span style={{ fontSize: 12 }}>Hour {it.hour}</span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                color:
                                  it.status === 'Present'
                                    ? '#065f46'
                                    : it.status === 'Leave'
                                      ? '#9a3412'
                                      : '#b91c1c',
                                background:
                                  it.status === 'Present'
                                    ? 'rgba(16,185,129,0.12)'
                                    : it.status === 'Leave'
                                      ? 'rgba(249,115,22,0.18)'
                                      : 'rgba(248,113,113,0.18)',
                              }}
                            >
                              {it.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="note" style={{ marginTop: 4, fontSize: 11 }}>
                      No attendance recorded for this date.
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  )
}
