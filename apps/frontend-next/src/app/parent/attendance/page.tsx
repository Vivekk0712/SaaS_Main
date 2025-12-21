"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, getSubjects, subjectForHourFor } from '../../teacher/data'
import { BarChart, LineChart, type LineSeries } from '../../components/LineChart'
import { subjectColor, type ColorTag } from '../../lib/colors'

type LogEntry = { date: string; hour: number; status: 'Present' | 'Absent'; topic?: string }
type SubjectStats = { total: number; present: number; absent: number; logs: LogEntry[] }
type DailySummary = {
  date: string
  total: number
  present: number
  absent: number
  items: Array<{ hour: number; status: 'Present' | 'Absent'; subject?: string }>
}

type MonthlySummary = {
  monthKey: string
  label: string
  present: number
  absent: number
  total: number
}

type DayStatus = 'present' | 'absent' | 'none'

type MonthCalendarView = {
  monthKey: string
  label: string
  weeks: Array<Array<{ day: number | null; status: DayStatus }>>
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
      total: 0,
    }
    existing.present += day.present
    existing.absent += day.absent
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
      total: acc.total + m.total,
    }),
    { present: 0, absent: 0, total: 0 },
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
    if (day.present === 0 && day.absent === 0) {
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

function AttendanceDonut({ present, absent }: { present: number; absent: number }) {
  const total = present + absent
  if (!total) {
    return <div className="note" style={{ fontSize: 12 }}>No attendance recorded yet.</div>
  }
  const values = [present, absent]
  const colors = ['#22c55e', '#ef4444']
  const labels = ['Present', 'Absent']
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
  const [showSubjectChart, setShowSubjectChart] = React.useState(false)
  const [showSubjectFilter, setShowSubjectFilter] = React.useState(false)
  const [chartSubjects, setChartSubjects] = React.useState<string[]>([])
  const [chartFrom, setChartFrom] = React.useState<string | null>(null)
  const [chartTo, setChartTo] = React.useState<string | null>(null)
  const [subjectFilterTab, setSubjectFilterTab] = React.useState<'range' | 'subjects'>('range')

  const recompute = React.useCallback(async () => {
    try {
      const sraw = sessionStorage.getItem('parent')
      if (!sraw) return
      const { roll } = JSON.parse(sraw)
      const me = findStudent(roll)
      if (!me) return
      // Prefer DB-backed attendance; fall back to any local seed if needed
      let store: Record<string, Record<string, any>> = {}
      try {
        const res = await fetch(
          `/api/mysql/teacher/attendance?klass=${encodeURIComponent(
            me.klass,
          )}&section=${encodeURIComponent(me.section)}`,
        )
        if (res.ok) {
          const j = await res.json()
          if (j && j.items && typeof j.items === 'object') {
            store = j.items as Record<string, Record<string, any>>
          }
        }
      } catch {
        // ignore; we'll try local fallback
      }
      if (!store || !Object.keys(store).length) {
        const raw = localStorage.getItem('school:attendance')
        store = raw ? (JSON.parse(raw) as Record<string, Record<string, any>>) : {}
      }
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
        else status = 'Absent'

        const topic = topicStore[k] || ''
        const bucket = (init[subjKey] ||= { total: 0, present: 0, absent: 0, logs: [] })
        bucket.total += 1
        if (status === 'Present') bucket.present += 1
        else bucket.absent += 1
        bucket.logs.push({ date, hour, status, topic: topic || undefined })

        const day = (dailyMap[date] ||= { date, total: 0, present: 0, absent: 0, items: [] })
        day.total += 1
        if (status === 'Present') day.present += 1
        else day.absent += 1
        day.items.push({ hour, status, subject: subjKey })
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

  const allDates = React.useMemo(
    () => Object.keys(daily).sort((a, b) => a.localeCompare(b)),
    [daily],
  )

  React.useEffect(() => {
    if (!allDates.length) return
    setChartFrom((prev) => prev || allDates[0])
    setChartTo((prev) => prev || allDates[allDates.length - 1])
  }, [allDates])

  const subjectList = React.useMemo(
    () => Object.keys(stats).sort((a, b) => a.localeCompare(b)),
    [stats],
  )

  const subjectChart = React.useMemo(() => {
    if (!subjectList.length || !allDates.length) return null
    const from = chartFrom || allDates[0]
    const to = chartTo || allDates[allDates.length - 1]
    if (!from || !to || from > to) return null
    const rangeDates = allDates.filter((d) => d >= from && d <= to)
    if (!rangeDates.length) return null

    // For long ranges, group days into buckets so the chart stays readable.
    const maxBuckets = 10
    const bucketSize = Math.max(1, Math.ceil(rangeDates.length / maxBuckets))

    type Bucket = { key: string; dates: string[] }
    const buckets: Bucket[] = []
    for (let i = 0; i < rangeDates.length; i += bucketSize) {
      const slice = rangeDates.slice(i, i + bucketSize)
      if (!slice.length) continue
      const first = slice[0]
      const last = slice[slice.length - 1]
      const key = first === last ? formatDMY(first) : `${formatDMY(first)}–${formatDMY(last)}`
      buckets.push({ key, dates: slice })
    }

    const chosen = chartSubjects.length ? chartSubjects : subjectList
    const palette = ['#2563eb', '#f97316', '#10b981', '#a855f7', '#06b6d4', '#e11d48', '#22c55e', '#facc15']

    const series: LineSeries[] = chosen.map((sub, idx) => {
      const s = stats[sub]
      if (!s || !s.logs || !s.logs.length) {
        return {
          name: sub,
          color: palette[idx % palette.length],
          data: buckets.map(() => null),
        }
      }
      // Pre-index logs by date for quick lookup
      const perDay: Record<string, { present: number; total: number }> = {}
      for (const log of s.logs) {
        if (log.date < from || log.date > to) continue
        const bucket = (perDay[log.date] ||= { present: 0, total: 0 })
        bucket.total += 1
        if (log.status === 'Present') bucket.present += 1
      }
      const data = buckets.map((b) => {
        let present = 0
        let total = 0
        for (const d of b.dates) {
          const e = perDay[d]
          if (!e) continue
          present += e.present
          total += e.total
        }
        if (!total) return null
        return Math.round((present * 100) / total)
      })
      return {
        name: sub,
        color: palette[idx % palette.length],
        data,
      }
    })

    const categories = buckets.map((b) => b.key)
    return { categories, series }
  }, [subjectList, allDates, chartFrom, chartTo, chartSubjects, stats])

  const subjectRange = React.useMemo(() => {
    if (!subjectList.length || !allDates.length) return null
    const from = chartFrom || allDates[0]
    const to = chartTo || allDates[allDates.length - 1]
    if (!from || !to || from > to) return null
    const chosen = chartSubjects.length ? chartSubjects : subjectList
    let present = 0
    let absent = 0
    let total = 0
    for (const sub of chosen) {
      const s = stats[sub]
      if (!s || !s.logs) continue
      for (const log of s.logs) {
        if (log.date < from || log.date > to) continue
        total += 1
        if (log.status === 'Present') present += 1
        else absent += 1
      }
    }
    if (!total) return null
    const label =
      from === to ? formatDMY(from) : `${formatDMY(from)} – ${formatDMY(to)}`
    return { present, absent, total, label, subjectCount: chosen.length }
  }, [subjectList, allDates, chartFrom, chartTo, chartSubjects, stats])

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
  // Use a limited number of Y ticks so labels don't overlap (about 6 steps)
  const approxTicks = 6
  const rawStep = yMaxMonthly / approxTicks || 5
  const step = Math.max(5, Math.ceil(rawStep / 5) * 5)
  const yTicksMonthly = Array.from(
    { length: Math.floor(yMaxMonthly / step) + 1 },
    (_, i) => i * step,
  )
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
                ]}
                height={220}
                yMax={yMaxMonthly}
                yTicks={yTicksMonthly}
              />
          </div>
          <div className="card" style={{ padding: '12px 14px', borderRadius: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Annual attendance details</div>
            <AttendanceDonut present={annual.present} absent={annual.absent} />
          </div>
        </div>
      )}

      {calendarMonths.length > 0 && activeMonth && (
        <div className="card" style={{ marginTop: 12, padding: '12px 14px', borderRadius: 16 }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
            <div style={{ fontWeight: 700 }}>Monthly attendance calendar</div>
            <button
              type="button"
              className="btn-ghost"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid #ea580c',
                background: showSubjectChart ? '#ea580c' : '#fff7ed',
                color: showSubjectChart ? '#ffffff' : '#9a3412',
                fontWeight: 700,
              }}
              onClick={() => setShowSubjectChart(prev => !prev)}
            >
              {showSubjectChart ? 'Hide subject-wise summary' : 'Subject-wise attendance'}
            </button>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
            Colored dots show days marked present or absent.
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
          </div>
          {showSubjectChart && subjectRange && (
            <div
              style={{
                marginTop: 12,
                borderTop: '1px dashed #e5e7eb',
                paddingTop: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>Attendance in selected range</div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: '#ea580c',
                    color: '#ffffff',
                    border: '1px solid #ea580c',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowSubjectFilter(true)}
                >
                  Filter
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <AttendanceDonut present={subjectRange.present} absent={subjectRange.absent} />
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                    Present — {Math.round((subjectRange.present * 100) / subjectRange.total)}%
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    Absent — {Math.round((subjectRange.absent * 100) / subjectRange.total)}%
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {subjectRange.label}
                  </div>
                  <div style={{ marginBottom: 2 }}>
                    <strong>{subjectRange.total}</strong> periods across{' '}
                    <strong>{(chartSubjects.length ? chartSubjects : subjectList).join(', ')}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                          <span style={{fontWeight:700, color: entry.status === 'Present' ? 'var(--success)' : 'var(--danger)'}}>{entry.status}</span>
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
                const allPresent = !!day && day.absent === 0 && day.total > 0
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
                        Present: {day.present}, Absent: {day.absent}, Total: {day.total}
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
                                  : 'rgba(248,113,113,0.10)',
                            }}
                          >
                            <span style={{ fontSize: 12 }}>
                              Hour {it.hour}
                              {it.subject ? ` — ${it.subject}` : ''}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                color:
                                  it.status === 'Present'
                                    ? '#065f46'
                                    : '#b91c1c',
                                background:
                                  it.status === 'Present'
                                    ? 'rgba(16,185,129,0.12)'
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
      {showSubjectChart && subjectRange && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            zIndex: 55,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 24px 60px rgba(15,23,42,0.45)',
              padding: '18px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>Attendance in selected range</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: '#ea580c',
                    color: '#ffffff',
                    border: '1px solid #ea580c',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowSubjectFilter(true)}
                >
                  Filter
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 16, padding: '2px 8px' }}
                  onClick={() => setShowSubjectChart(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <AttendanceDonut present={subjectRange.present} absent={subjectRange.absent} />
              <div style={{ fontSize: 13 }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                  Present — {Math.round((subjectRange.present * 100) / subjectRange.total)}%
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                  Absent — {Math.round((subjectRange.absent * 100) / subjectRange.total)}%
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  {subjectRange.label}
                </div>
                <div>
                  <strong>{subjectRange.total}</strong> periods across{' '}
                  <strong>{(chartSubjects.length ? chartSubjects : subjectList).join(', ')}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSubjectFilter && (
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
              <div style={{ fontWeight: 700, fontSize: 15 }}>Subject-wise filters</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setChartSubjects([])
                    setChartFrom(null)
                    setChartTo(null)
                  }}
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowSubjectFilter(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px minmax(0,1fr)',
                minHeight: 260,
              }}
            >
              <div
                style={{
                  borderRight: '1px solid #e5e7eb',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: subjectFilterTab === 'range' ? '#eff6ff' : 'transparent',
                    fontWeight: subjectFilterTab === 'range' ? 600 : 500,
                  }}
                  onClick={() => setSubjectFilterTab('range')}
                >
                  Date range
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: subjectFilterTab === 'subjects' ? '#eff6ff' : 'transparent',
                    fontWeight: subjectFilterTab === 'subjects' ? 600 : 500,
                  }}
                  onClick={() => setSubjectFilterTab('subjects')}
                >
                  Subjects
                </button>
              </div>
              <div style={{ padding: '12px 16px', fontSize: 13, overflowY: 'auto' }}>
                {subjectFilterTab === 'range' && (
                  <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>From</div>
                      <input
                        className="input"
                        type="date"
                        value={chartFrom || (allDates[0] || '')}
                        min={allDates[0]}
                        max={allDates[allDates.length - 1]}
                        onChange={(e) => setChartFrom(e.target.value || null)}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>To</div>
                      <input
                        className="input"
                        type="date"
                        value={chartTo || (allDates[allDates.length - 1] || '')}
                        min={allDates[0]}
                        max={allDates[allDates.length - 1]}
                        onChange={(e) => setChartTo(e.target.value || null)}
                      />
                    </div>
                    <p className="note">
                      Pick any window inside the available attendance dates. The chart will show daily %
                      for the chosen subjects.
                    </p>
                  </div>
                )}
                {subjectFilterTab === 'subjects' && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Subjects</div>
                    {subjectList.length === 0 && (
                      <p className="note">No subjects detected yet.</p>
                    )}
                    {subjectList.map((sub) => {
                      const checked = chartSubjects.includes(sub)
                      return (
                        <label
                          key={sub}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 2px',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setChartSubjects((prev) => {
                                const has = prev.includes(sub)
                                if (has) return prev.filter((s) => s !== sub)
                                return [...prev, sub]
                              })
                            }}
                          />
                          <span>{sub}</span>
                        </label>
                      )
                    })}
                    <p className="note">
                      Leave everything selected to see all subjects together.
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
                {subjectChart && (
                  <>
                    <strong>{subjectChart.series.length}</strong> subjects •{' '}
                    <strong>{subjectChart.categories.length}</strong> days
                  </>
                )}
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '6px 18px', borderRadius: 999 }}
                onClick={() => setShowSubjectFilter(false)}
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
