"use client"
import * as R from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { readMarksByStudent, getSubjects, getClassSubjects, studentAttendanceSummaryBefore, studentAttendanceSummaryBetween, findStudent, rosterBy } from '../../teacher/data'
import { BarChart, type LineSeries } from '../../components/LineChart'
import { subjectColor, type ColorTag } from '../../lib/colors'

export default function ParentProgressPage() {
  const pathname = usePathname()
  const [rows, setRows] = R.useState<Array<{ test: string; subject: string; score: number; max: number; ts?: number; date?: string }>>([])

  const [meInfo, setMeInfo] = R.useState<{ name: string; usn: string; klass: string; section: 'A'|'B' } | null>(null)
  // Ranks removed in parent progress per requirement

  const recompute = R.useCallback(async () => {
    try {
      // 1) Try resolving via shared student session (same as student progress)
      let sraw = sessionStorage.getItem('student')
      let s = null as ReturnType<typeof findStudent> | null
      if (sraw) {
        const { roll } = JSON.parse(sraw)
        s = findStudent(String(roll || ''))
      }
      // 2) Fallback: resolve from parent session via phone (MySQL-backed profiles)
      if (!s) {
        const praw = sessionStorage.getItem('parent')
        if (praw) {
          try {
            const { phone } = JSON.parse(praw)
            if (phone) {
              const j = await (await fetch('/api/mysql/profiles/students')).json()
              const mine = (j.items || []).find((x:any) => String(x.parentPhone || '') === String(phone))
              if (mine) {
                const usn = String(mine.usn || '')
                const stub = { roll: usn, name: String(mine.name||'Student'), grade: String(mine.grade||''), section: String(mine.section||'') }
                try { sessionStorage.setItem('student', JSON.stringify(stub)) } catch {}
                s = { usn, name: stub.name, klass: stub.grade, section: stub.section as any }
              }
            }
          } catch {}
        }
      }
      // 3) Fallback: use roll stored directly on parent session (set by dashboard)
      if (!s) {
        try {
          const praw = sessionStorage.getItem('parent')
          if (praw) {
            const { roll } = JSON.parse(praw)
            if (roll) {
              const me = findStudent(String(roll))
              if (me) {
                s = { usn: me.usn, name: me.name, klass: me.klass, section: me.section as any }
              } else {
                s = { usn: String(roll), name: 'Student', klass: '', section: 'A' as any }
              }
            }
          }
        } catch {}
      }
      if (!s) return
      const info = { name: s.name, usn: s.usn, klass: s.klass, section: s.section as any }
      // Map to effective USN using roster when roll/name mismatch
      let effUsn = s.usn
      try {
        const roster = rosterBy(info.klass, info.section)
        if (roster && roster.length) {
          const nk = (x:string)=>String(x||'').toLowerCase().trim()
          const byRoll = roster.find(r => nk(r.usn) === nk(s.usn))
          if (!byRoll) {
            const byName = roster.find(r => nk(r.name) === nk(info.name))
            if (byName) effUsn = byName.usn
          }
        }
      } catch {}
      setMeInfo(info)
      let arr = readMarksByStudent(effUsn)
      // If no marks found, try raw roll from parent session as last resort
      if (!arr.length) {
        try {
          const praw = sessionStorage.getItem('parent')
          if (praw) {
            const { roll } = JSON.parse(praw)
            if (roll) {
              arr = readMarksByStudent(String(roll))
            }
          }
        } catch {}
      }
      // Normalize subjects case-insensitively using class-specific list
      const list = (getClassSubjects(info.klass, info.section) || getSubjects())
      const disp: Record<string,string> = {}
      for (const ssub of list) disp[String(ssub).toLowerCase()] = ssub
      setRows(arr.map(r => ({ test: r.test, subject: disp[String(r.subject||'').toLowerCase()] || r.subject, score: r.score, max: r.max, ts: r.ts, date: r.date })))
    } catch {}
  }, [])

  R.useEffect(() => {
    recompute()
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:marks') recompute() }
    const onBus = (e: Event) => {
      try { const detail = (e as CustomEvent).detail; if (!detail || !detail.key || detail.key === 'school:marks') recompute() } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [recompute])

  

  const BANNER_COLORS = ['blue','green','orange','pink','violet'] as const
  function colorForTest(name: string, idx: number) {
    const n = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (n.startsWith('ut 1')) return 'blue'
    if (n.startsWith('ut 2')) return 'green'
    if (n.startsWith('ut 3')) return 'orange'
    if (n.startsWith('ut 4')) return 'pink'
    if (n.includes('mid')) return 'violet'
    if (n.endsWith('sem')) return 'violet'
    return BANNER_COLORS[(idx + Array.from(name||'').reduce((s,c)=>s+c.charCodeAt(0),0)) % BANNER_COLORS.length]
  }
  const gradeFor = (pct: number) => pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'F'
  const onPrint = (cardId: string) => {
    try {
      const el = document.getElementById(cardId)
      if (!el) return
      el.classList.add('print-area')
      window.print()
      setTimeout(() => el.classList.remove('print-area'), 0)
    } catch {}
  }

  // Build test-wise aggregates for charts (trend + comparisons)
  const byTest = R.useMemo(() => {
    const m: Record<string, { items: Array<{ subject: string; score: number; max: number }>; date?: string; ts?: number; sum: number; total: number; pct: number } > = {}
    for (const r of rows) {
      if (!m[r.test]) m[r.test] = { items: [], date: r.date, ts: r.ts, sum: 0, total: 0, pct: 0 }
      m[r.test].items.push({ subject: r.subject, score: r.score, max: r.max })
      m[r.test].sum += r.score
      m[r.test].total += r.max
      if (!m[r.test].date && r.date) m[r.test].date = r.date
      if (!m[r.test].ts && r.ts) m[r.test].ts = r.ts
    }
    for (const k of Object.keys(m)) {
      m[k].pct = m[k].total ? Math.round((m[k].sum * 100) / m[k].total) : 0
      m[k].items.sort((a,b) => a.subject.localeCompare(b.subject))
    }
    return Object.entries(m).sort((a,b) => (b[1].ts || 0) - (a[1].ts || 0))
  }, [rows])

  // Selected tests filter (allows single-test or multi-test comparison)
  const [selectedTests, setSelectedTests] = R.useState<string[]>([])

  const filteredByTest = R.useMemo(() => {
    if (!selectedTests.length) return byTest
    const set = new Set(selectedTests)
    return byTest.filter(([name]) => set.has(name))
  }, [byTest, selectedTests])

  // Keep selection in sync with available tests and default to "all"
  R.useEffect(() => {
    const names = byTest.map(([name]) => name)
    setSelectedTests(prev => {
      if (!prev.length) return names
      const still = prev.filter(n => names.includes(n))
      return still.length ? still : names
    })
  }, [byTest])

  const latestVsPrev = R.useMemo(() => {
    // Compute change between the latest test and previous one
    // byTest is newest first
    const a = byTest[0]
    const b = byTest[1]
    if (!a || !b) return null
    const curr = a[1]
    const prev = b[1]
    const delta = curr.pct - prev.pct
    // Build per-subject pct map for each test
    const per = (testName: string) => {
      const acc: Record<string, { sum: number; total: number }> = {}
      for (const r of rows) {
        if (r.test !== testName) continue
        if (!acc[r.subject]) acc[r.subject] = { sum: 0, total: 0 }
        acc[r.subject].sum += r.score
        acc[r.subject].total += r.max
      }
      const out: Record<string, number> = {}
      for (const sub of Object.keys(acc)) {
        const { sum, total } = acc[sub]
        out[sub] = total ? Math.round((sum * 100) / total) : 0
      }
      return out
    }
    const mapCurr = per(a[0])
    const mapPrev = per(b[0])
    const subs = new Set<string>([...Object.keys(mapCurr), ...Object.keys(mapPrev)])
    const subjectRows = Array.from(subs).sort((x,y)=>x.localeCompare(y)).map(sub => {
      const c = mapCurr[sub] ?? 0
      const p = mapPrev[sub] ?? 0
      const d = c - p
      return { subject: sub, curr: c, prev: p, delta: d }
    })
    return { name: a[0], prevName: b[0], currPct: curr.pct, prevPct: prev.pct, delta, date: curr.date, subjects: subjectRows }
  }, [byTest, rows])

  // Selection for bar chart details popup (must be top-level hook)
  const [barSel, setBarSel] = R.useState<{ category: string; series: string; value: number | null; extra?: string } | null>(null)

  const subjectAvgs = R.useMemo(() => {
    const acc: Record<string, { sum: number; total: number }> = {}
    const subs = meInfo ? getClassSubjects(meInfo.klass, meInfo.section) : getSubjects()
    for (const r of rows) {
      if (!acc[r.subject]) acc[r.subject] = { sum: 0, total: 0 }
      acc[r.subject].sum += r.score
      acc[r.subject].total += r.max
    }
    const order = (subs && subs.length ? subs : Object.keys(acc).sort((a,b)=>a.localeCompare(b)))
    return order.map(sub => {
      const { sum, total } = acc[sub] || { sum: 0, total: 0 }
      const pct = total ? Math.round((sum * 100) / total) : 0
      return { subject: sub, pct }
    })
  }, [rows])

  const subjectList = R.useMemo(() => {
    const set = new Set<string>()
    for (const [, data] of filteredByTest) {
      for (const it of data.items) set.add(it.subject)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [filteredByTest])

  const [selectedSubjectsFilter, setSelectedSubjectsFilter] = R.useState<string[]>([])
  const [showSubjectFilter, setShowSubjectFilter] = R.useState(false)

  // Keep subject filter in sync with available subjects; default to all
  R.useEffect(() => {
    const names = subjectList
    setSelectedSubjectsFilter(prev => {
      if (!prev.length) return names
      const still = prev.filter(n => names.includes(n))
      return still.length ? still : names
    })
  }, [subjectList])

  const visibleSubjects = R.useMemo(
    () => (selectedSubjectsFilter.length ? selectedSubjectsFilter : subjectList),
    [selectedSubjectsFilter, subjectList],
  )

  const [popupSubject, setPopupSubject] = R.useState<string | null>(null)

  const popupDetails = R.useMemo(() => {
    if (!popupSubject || !meInfo) return null
    const want = popupSubject.toLowerCase()
    const rows: Array<{ testName: string; date?: string; order: number; score: number; max: number; pct: number; attPct: number | null }> = []
    for (const [testName, data] of filteredByTest) {
      const item = data.items.find(it => it.subject.toLowerCase() === want)
      if (!item) continue
      const pct = item.max ? Math.round((item.score * 100) / item.max) : 0
      let attPct: number | null = null
      if (data.date) {
        try {
          const a = studentAttendanceSummaryBefore(meInfo.usn, meInfo.klass, meInfo.section, data.date || '', popupSubject)
          attPct = a.total ? Math.round((a.attended * 100) / a.total) : 0
        } catch {
          attPct = null
        }
      }
      rows.push({ testName, date: data.date, order: data.ts || 0, score: item.score, max: item.max, pct, attPct })
    }
    if (!rows.length) return null
    rows.sort((a, b) => a.order - b.order || (a.date || '').localeCompare(b.date || ''))
    return { subject: popupSubject, rows }
  }, [popupSubject, filteredByTest, meInfo])

  const toggleTest = (name: string) => {
    setSelectedTests(prev => {
      const set = new Set(prev)
      if (set.has(name)) {
        set.delete(name)
      } else {
        set.add(name)
      }
      return Array.from(set)
    })
  }

  function DonutChart({ data }: { data: Array<{ subject: string; pct: number }> }) {
    const colorHex: Record<ColorTag,string> = { blue:'#3b82f6', green:'#10b981', orange:'#f59e0b', pink:'#ec4899', violet:'#8b5cf6' }
    const values = data.map(d => Math.max(0, d.pct))
    const total = values.reduce((s, v) => s + v, 0) || 1
    const r = 36
    const c = 2 * Math.PI * r
    let offset = 0
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Performance distribution">
        <g transform="translate(60,60)">
          <circle r={r} cx={0} cy={0} fill="none" stroke="#e5e7eb" strokeWidth={12} />
          {data.map((d, i) => {
            const frac = (values[i] / total)
            const len = c * frac
            const dash = `${len} ${c - len}`
            const el = (
              <circle key={i}
                      r={r}
                      cx={0}
                      cy={0}
                      fill="none"
                      stroke={colorHex[subjectColor(d.subject)] || '#999'}
                      strokeWidth={12}
                      strokeDasharray={dash}
                      strokeDashoffset={-offset}
                      transform="rotate(-90)" />
            )
            offset += len
            return el
          })}
          {/* center label removed */}
        </g>
      </svg>
    )
  }

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
            <h2 className="title">Progress Report</h2>
            <p className="subtitle">Structured marks cards by test</p>
      {meInfo && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight: 800 }}>{meInfo.name}</div>
            <div className="note">{meInfo.klass} • {meInfo.section}</div>
          </div>
        </div>
      )}

      <div style={{display:'grid', gap:12, marginTop:12}}>
        {byTest.length > 0 && (
          <div className="card" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Filter by tests</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setSelectedTests(byTest.map(([name]) => name))}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setSelectedTests([])}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {byTest.map(([testName]) => (
                <label key={testName} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(testName)}
                    onChange={() => toggleTest(testName)}
                  />
                  <span>{testName}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Marks & Attendance charts with subject filter (same as student) */}
        {filteredByTest.length > 0 && meInfo && (() => {
          const tests = filteredByTest
          if (tests.length === 0) return null
          const subjectsAll = Array.from(
            new Set(tests.flatMap(([_, d]) => d.items.map(it => it.subject))),
          ).sort((a, b) => a.localeCompare(b))
          const subjects = visibleSubjects.length ? visibleSubjects : subjectsAll
          const palette = ['#2563eb', '#f97316', '#10b981', '#a855f7', '#06b6d4', '#e11d48', '#22c55e', '#facc15']
          const colorForSeries = (index: number) => palette[index % palette.length]
          const marksSeries: LineSeries[] = []
          const attendanceSeries: LineSeries[] = []
          const fmt = (ymd?: string) =>
            ymd && ymd.length >= 10 ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}` : ''

          // Marks series per test
          tests.forEach(([t, d], idx) => {
            const map: Record<string, { score: number; max: number }> = {}
            d.items.forEach((it) => {
              map[it.subject] = { score: Number(it.score) || 0, max: Number(it.max) || 0 }
            })
            const data = subjects.map((s) => {
              const m = map[s]
              if (!m || !m.max) return 0
              return Math.round((m.score * 100) / m.max)
            })
            marksSeries.push({ name: `${t} Marks %`, color: colorForSeries(idx), data })
          })

          // Attendance windows using chronological order of selected tests
          const chronological = [...tests]
            .map(([t, d]) => ({ t, d }))
            .filter((x) => x.d.date)
            .sort((a, b) => (a.d.ts || 0) - (b.d.ts || 0))
          const rangeNotes: string[] = []
          chronological.forEach((entry, idx) => {
            const current = entry
            const prev = idx > 0 ? chronological[idx - 1] : null
            const att = subjects.map((sub) => {
              try {
                if (!current.d.date) return 0
                if (!prev) {
                  const a = studentAttendanceSummaryBefore(
                    meInfo.usn,
                    meInfo.klass,
                    meInfo.section,
                    current.d.date,
                    sub,
                  )
                  return a.total ? Math.round((a.attended * 100) / a.total) : 0
                }
                if (prev.d.date) {
                  const a = studentAttendanceSummaryBetween(
                    meInfo.usn,
                    meInfo.klass,
                    meInfo.section,
                    prev.d.date,
                    current.d.date,
                    sub,
                  )
                  return a.total ? Math.round((a.attended * 100) / a.total) : 0
                }
              } catch {}
              return 0
            })
            const label =
              prev && prev.d.date
                ? `${fmt(prev.d.date)} – ${fmt(current.d.date)}`
                : `Up to ${fmt(current.d.date)}`
            if (current.d.date) rangeNotes.push(label)
            attendanceSeries.push({
              name: `${current.t} Attendance % (${label})`,
              color: colorForSeries(tests.length + idx),
              data: att,
            })
          })

          const titleSuffix = tests.length === 1 ? '1 Test' : `${tests.length} Tests`
          return (
            <div className="chart-card" style={{ position: 'relative', overflow: 'visible' }}>
              {subjectList.length > 0 && (
                <div style={{ display: 'grid', gap: 6, marginBottom: 8, position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontSize: 11,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>📚</span>
                        <span>Marks</span>
                      </span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>✅</span>
                        <span>Attendance</span>
                      </span>
                      {subjects.length > 0 && (
                        <span style={{ opacity: 0.7, fontSize: 10 }}>
                          • {subjects.length} subject{subjects.length > 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                      <button
                        type="button"
                        aria-label="Filter subjects"
                        onClick={() => setShowSubjectFilter((open) => !open)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: 'linear-gradient(135deg, #f97316, #8b5cf6)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 12,
                            height: 12,
                            display: 'inline-block',
                            borderTopLeftRadius: 2,
                            borderTopRightRadius: 2,
                            borderBottomRightRadius: 4,
                            borderBottomLeftRadius: 4,
                            position: 'relative',
                            background: '#ffffff',
                            clipPath:
                              'polygon(15% 0, 85% 0, 60% 40%, 60% 100%, 40% 100%, 40% 40%)',
                          }}
                        />
                      </button>
                      {showSubjectFilter && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 26,
                            right: 0,
                            background: 'var(--panel)',
                            borderRadius: 12,
                            border: '1px solid var(--panel-border)',
                            padding: '8px 10px',
                            boxShadow: '0 16px 32px rgba(15,23,42,0.25)',
                            zIndex: 30,
                            minWidth: 160,
                          }}
                        >
                          {subjectList.map((sub) => (
                            <label
                              key={sub}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 11,
                                marginBottom: 4,
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubjectsFilter.includes(sub)}
                                onChange={() =>
                                  setSelectedSubjectsFilter((prev) => {
                                    const set = new Set(prev)
                                    if (set.has(sub)) set.delete(sub)
                                    else set.add(sub)
                                    return Array.from(set)
                                  })
                                }
                                style={{ width: 12, height: 12 }}
                              />
                              <span>{sub}</span>
                            </label>
                          ))}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginTop: 6,
                              gap: 6,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedSubjectsFilter([])}
                              style={{
                                borderRadius: 999,
                                padding: '3px 8px',
                                fontSize: 10,
                                border: '1px solid rgba(148,163,184,0.7)',
                                background: 'rgba(248,250,252,0.9)',
                                cursor: 'pointer',
                              }}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedSubjectsFilter.length)
                                  setSelectedSubjectsFilter(subjectList)
                                setShowSubjectFilter(false)
                              }}
                              style={{
                                borderRadius: 999,
                                padding: '3px 8px',
                                fontSize: 10,
                                border: '1px solid rgba(37,99,235,0.9)',
                                background: 'rgba(219,234,254,0.95)',
                                cursor: 'pointer',
                              }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gap: 10 }}>
                <BarChart
                  title={`Marks — ${titleSuffix}`}
                  categories={subjects}
                  series={marksSeries}
                  yMax={100}
                />
                <BarChart
                  title={`Attendance — ${titleSuffix}`}
                  categories={subjects}
                  series={attendanceSeries}
                  yMax={100}
                />
                {rangeNotes.length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.8,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    {rangeNotes.map((r, idx) => (
                      <span key={`${r}-${idx}`}>Range {idx + 1}: {r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
        {/* Comparison extras removed per request; focus on one clear graph */}
        {byTest.length === 0 && <div className="note">No marks recorded yet.</div>}
        {filteredByTest.map(([testName, data], idx) => {
          const color = colorForTest(testName, idx)
          const overallGrade = gradeFor(data.pct)
          const cardId = `p-marks-card-${idx}`
          return (
            <div key={testName} id={cardId} className="marks-card">
              <div className={`marks-header banner-${color}`} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--panel-border)'}}>
                <div style={{display:'flex', flexDirection:'column'}}>
                  <div style={{fontWeight:800}}>{testName}</div>
                  <small>{data.date ? data.date : ''}</small>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span className="chip-grade">{overallGrade}</span>
                  <div style={{fontWeight:800, fontSize:20}}>{data.pct}%</div>
                  <button className="btn-tiny" type="button" onClick={() => onPrint(cardId)} title="Download PDF via Print">Print / PDF</button>
                </div>
              </div>
              <div className="marks-table">
                <div className="marks-head">
                  <strong>Subject</strong>
                  <strong>Marks</strong>
                  <strong>Percent</strong>
                </div>
                <div className="marks-body">
                  {data.items.map((it, i2) => (
                    <div key={i2} className="marks-row">
                      <span>{it.subject}</span>
                      <span style={{textAlign:'center', fontWeight:700}}>{it.score} / {it.max}</span>
                      {(() => { const pct = it.max ? Math.round((it.score*100)/it.max) : 0; const g = gradeFor(pct); return (
                        <span style={{textAlign:'right', fontWeight:800}}>{pct}% <span className="chip-grade" style={{marginLeft:6}}>{g}</span></span>
                      )})()}
                    </div>
                  ))}
                </div>
                <div className="marks-foot">
                  <strong>Total</strong>
                  <strong style={{textAlign:'center'}}>{data.sum} / {data.total}</strong>
                  <strong style={{textAlign:'right'}}>{data.pct}%</strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>
          </div>
        </div>
      </div>
    </div>
  )
}
