"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { readMarksByStudent, getSubjects, getClassSubjects, studentAttendanceSummaryBefore, studentAttendanceSummaryBetween, findStudent, rosterBy } from '../../teacher/data'
import { BarChart, type LineSeries } from '../../components/LineChart'

export default function StudentProgressPage() {
  const pathname = usePathname()
  const [rows, setRows] = React.useState<Array<{ test: string; subject: string; score: number; max: number; ts?: number; date?: string }>>([])
  const [meInfo, setMeInfo] = React.useState<{ name: string; usn: string; klass: string; section: 'A'|'B' } | null>(null)

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/progress', label: 'Progress', icon: '📊' },
    { href: '/student/attendance', label: 'Attendance', icon: '✅' },
    { href: '/student/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/student/calendar', label: 'Calendar', icon: '📅' },
    { href: '/student/circulars', label: 'Circulars', icon: '📣' },
    { href: '/student/syllabus', label: 'Academic Syllabus', icon: '📘' }
  ]

  const recompute = React.useCallback(async () => {
    try {
      // Resolve current student from session; fallback to parent session if needed
      let sraw = sessionStorage.getItem('student')
      let s = null as ReturnType<typeof findStudent> | null
      if (sraw) {
        const { roll } = JSON.parse(sraw)
        s = findStudent(String(roll || ''))
      }
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
      const arr = readMarksByStudent(effUsn)
      // Normalize subjects to class-specific display names
      const list = (getClassSubjects(info.klass, info.section) || getSubjects())
      const disp: Record<string, string> = {}
      for (const sub of list) disp[String(sub).toLowerCase()] = sub
      setRows(arr.map(r => ({ test: r.test, subject: disp[String(r.subject||'').toLowerCase()] || r.subject, score: r.score, max: r.max, ts: r.ts, date: r.date })))
    } catch {}
  }, [])

  React.useEffect(() => {
    recompute()
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:marks') recompute() }
    const onBus = (e: Event) => {
      try { const detail = (e as CustomEvent).detail; if (!detail || !detail.key || detail.key === 'school:marks') recompute() } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [recompute])

  // Aggregate marks by test
  const byTest = React.useMemo(() => {
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
  const [selectedTests, setSelectedTests] = React.useState<string[]>([])

  const filteredByTest = React.useMemo(() => {
    if (!selectedTests.length) return byTest
    const set = new Set(selectedTests)
    return byTest.filter(([name]) => set.has(name))
  }, [byTest, selectedTests])

  const overallStats = React.useMemo(() => {
    if (!filteredByTest.length) return { marksPct: null as number | null, attendancePct: null as number | null }
    let marksSum = 0
    let marksTotal = 0
    for (const [, data] of filteredByTest) {
      marksSum += data.sum
      marksTotal += data.total
    }
    const marksPct = marksTotal ? Math.round((marksSum * 100) / marksTotal) : null

    let attendancePct: number | null = null
    if (meInfo) {
      let latestDate = ''
      for (const [, data] of filteredByTest) {
        if (data.date && data.date > latestDate) latestDate = data.date
      }
      if (latestDate) {
        try {
          const a = studentAttendanceSummaryBefore(meInfo.usn, meInfo.klass, meInfo.section, latestDate)
          attendancePct = a.total ? Math.round((a.attended * 100) / a.total) : 0
        } catch {
          attendancePct = null
        }
      }
    }

    return { marksPct, attendancePct }
  }, [filteredByTest, meInfo])

  // Keep selection in sync with available tests and default to "all"
  React.useEffect(() => {
    const names = byTest.map(([name]) => name)
    setSelectedTests(prev => {
      if (!prev.length) return names
      const still = prev.filter(n => names.includes(n))
      return still.length ? still : names
    })
  }, [byTest])

  const subjectList = React.useMemo(() => {
    const set = new Set<string>()
    for (const [, data] of filteredByTest) {
      for (const it of data.items) set.add(it.subject)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [filteredByTest])

  const [selectedSubjectsFilter, setSelectedSubjectsFilter] = React.useState<string[]>([])
  const [showSubjectFilter, setShowSubjectFilter] = React.useState(false)

  // Keep subject filter in sync with available subjects; default to all
  React.useEffect(() => {
    const names = subjectList
    setSelectedSubjectsFilter(prev => {
      if (!prev.length) return names
      const still = prev.filter(n => names.includes(n))
      return still.length ? still : names
    })
  }, [subjectList])

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

  return (
    <div className="student-shell">
      <div className="topbar topbar-student">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>STUDENT</strong>
          </div>
          <nav className="tabs" aria-label="Student quick navigation">
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
            <h2 className="title">Progress Report</h2>
            <p className="subtitle">Structured marks cards by test</p>
            {meInfo && (
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800 }}>{meInfo.name}</div>
                  <div className="note">
                    {meInfo.klass} • {meInfo.section}
                  </div>
                </div>
              </div>
            )}

            {byTest.length > 0 && (
              <div
                className="card"
                style={{
                  marginBottom: 4,
                  padding: '10px 14px',
                  borderRadius: 16,
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: '8px 10px',
                    background: '#111827',
                    color: '#e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div style={{ opacity: 0.8, fontSize: 11 }}>Marks</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {overallStats.marksPct != null ? `${overallStats.marksPct}%` : '--'}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 11 }}>Average across selected tests</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: '8px 10px',
                    background: '#1e293b',
                    color: '#dbeafe',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div style={{ opacity: 0.8, fontSize: 11 }}>Attendance</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {overallStats.attendancePct != null ? `${overallStats.attendancePct}%` : '--'}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 11 }}>Overall up to latest test</div>
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

        {filteredByTest.length > 0 && meInfo && (() => {
          const tests = filteredByTest
          if (tests.length === 0) return null
          const subjects = Array.from(new Set(tests.flatMap(([_, d]) => d.items.map(it => it.subject)))).sort((a,b)=>a.localeCompare(b))
          const subjectAgg: Record<string, { marksSum: number; marksTotal: number; attSum: number; attCount: number }> = {}
          subjects.forEach(s => {
            subjectAgg[s] = { marksSum: 0, marksTotal: 0, attSum: 0, attCount: 0 }
          })
          // Aggregate marks per subject across selected tests
          tests.forEach(([, d]) => {
            d.items.forEach(it => {
              const agg = subjectAgg[it.subject]
              if (!agg) return
              const s = Number(it.score) || 0
              const m = Number(it.max) || 0
              agg.marksSum += s
              agg.marksTotal += m
            })
          })

          const activeSet = selectedSubjectsFilter.length ? new Set(selectedSubjectsFilter) : new Set(subjects)
          const visibleSubjects = subjects.filter(s => activeSet.has(s))
          const palette = ['#2563eb', '#f97316', '#10b981', '#a855f7', '#06b6d4', '#e11d48', '#22c55e', '#facc15']
          const colorForSeries = (index: number) => palette[index % palette.length]
          const marksSeries: LineSeries[] = []
          const attendanceSeries: LineSeries[] = []
          const meta: Record<string, any> = {}
          const fmt = (ymd?: string) => (ymd && ymd.length >= 10) ? `${ymd.slice(8,10)}/${ymd.slice(5,7)}/${ymd.slice(0,4)}` : ''
          tests.forEach(([t, d], idx) => {
            const map: Record<string, { score: number; max: number }> = {}
            d.items.forEach(it => { map[it.subject] = { score: Number(it.score)||0, max: Number(it.max)||0 } })
            const data = visibleSubjects.map(s => {
              const m = map[s]
              if (!m || !m.max) return 0
              return Math.round((m.score * 100) / m.max)
            })
            marksSeries.push({ name: `${t} Marks %`, color: colorForSeries(idx), data })
            meta[`marks:${idx}`] = { testName: t, date: d.date, map }
          })
          // Attendance windows using chronological order of selected tests
          const chronological = [...tests]
            .map(([t, d]) => ({ t, d }))
            .filter(x => x.d.date)
            .sort((a, b) => (a.d.ts || 0) - (b.d.ts || 0))
          const rangeNotes: string[] = []
          chronological.forEach((entry, idx) => {
            const current = entry
            const prev = idx > 0 ? chronological[idx - 1] : null
            const att = subjects.map(sub => {
              try {
                if (!current.d.date) return 0
                if (!prev) {
                  const a = studentAttendanceSummaryBefore(meInfo.usn, meInfo.klass, meInfo.section, current.d.date, sub)
                  return a.total ? Math.round((a.attended * 100) / a.total) : 0
                }
                if (prev.d.date) {
                  const a = studentAttendanceSummaryBetween(
                    meInfo.usn,
                    meInfo.klass,
                    meInfo.section,
                    prev.d.date,
                    current.d.date,
                    sub
                  )
                  return a.total ? Math.round((a.attended * 100) / a.total) : 0
                }
              } catch {}
              return 0
            })
            // Update attendance aggregates per subject
            att.forEach((val, idx2) => {
              const sub = subjects[idx2]
              const agg = subjectAgg[sub]
              if (!agg) return
              agg.attSum += val
              agg.attCount += 1
            })
            const attVisible = visibleSubjects.map(sub => {
              const idxSubject = subjects.indexOf(sub)
              return idxSubject >= 0 ? att[idxSubject] : 0
            })
            const label = prev && prev.d.date
              ? `${fmt(prev.d.date)} – ${fmt(current.d.date)}`
              : `Up to ${fmt(current.d.date)}`
            if (current.d.date) rangeNotes.push(label)
            attendanceSeries.push({
              name: `${current.t} Attendance % (${label})`,
              color: colorForSeries(idx),
              data: attVisible
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
                      {visibleSubjects.length > 0 && (
                        <span style={{ opacity: 0.7, fontSize: 10 }}>
                          • {visibleSubjects.length} subject{visibleSubjects.length > 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                      <button
                        type="button"
                        aria-label="Filter subjects"
                        onClick={() => setShowSubjectFilter(open => !open)}
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
                            clipPath: 'polygon(15% 0, 85% 0, 60% 40%, 60% 100%, 40% 100%, 40% 40%)',
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
                          {subjectList.map(sub => (
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
                                  setSelectedSubjectsFilter(prev => {
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
                                if (!selectedSubjectsFilter.length) setSelectedSubjectsFilter(subjectList)
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
                <BarChart title={`Marks — ${titleSuffix}`} categories={visibleSubjects} series={marksSeries} yMax={100} />
                <BarChart title={`Attendance — ${titleSuffix}`} categories={visibleSubjects} series={attendanceSeries} yMax={100} />
                {rangeNotes.length > 0 && (
                  <div style={{ fontSize: 11, opacity: 0.8, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {rangeNotes.map((r, idx) => (
                      <span key={`${r}-${idx}`}>Range {idx + 1}: {r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
        {/* Marks cards (same style as parent) */}
        {filteredByTest.map(([testName, data], idx) => {
          const BANNER_COLORS = ['blue','green','orange','pink','violet'] as const
          const colorForTest = (name: string, i: number) => {
            const n = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
            if (n.startsWith('ut 1')) return 'blue'
            if (n.startsWith('ut 2')) return 'green'
            if (n.startsWith('ut 3')) return 'orange'
            if (n.startsWith('ut 4')) return 'pink'
            if (n.includes('mid')) return 'violet'
            if (n.endsWith('sem')) return 'violet'
            return BANNER_COLORS[(i + Array.from(name||'').reduce((s,c)=>s+c.charCodeAt(0),0)) % BANNER_COLORS.length]
          }
          const gradeFor = (pct: number) => pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'F'
          const color = colorForTest(testName, idx)
          const overallGrade = gradeFor(data.pct)
          const cardId = `s-marks-card-${idx}`
          const onPrint = (id: string) => { try { const el = document.getElementById(id); if (!el) return; el.classList.add('print-area'); window.print(); setTimeout(()=> el.classList.remove('print-area'), 0) } catch {} }
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
        {byTest.length === 0 && <div className="note">No marks recorded yet.</div>}
      </div>
          </div>
        </div>
      </div>
    </div>
  )
}
