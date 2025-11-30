"use client"
import React from 'react'
import Link from 'next/link'
import { LineChart, type LineSeries } from '../../components/LineChart'
import { getClasses, getSectionsForClass, listTestsForClass, readTotalsByTest, subjectAveragesForTest, getClassSubjects, getSubjects, TEACHERS } from '../../teacher/data'

export default function PrincipalPerformance() {
  const [klass, setKlass] = React.useState(() => getClasses()[0] || '')
  const [section, setSection] = React.useState(() => getSectionsForClass(getClasses()[0] || '')[0] || 'A')
  const [teacher, setTeacher] = React.useState<string>(() => (TEACHERS[0]?.name) || '')

  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [klass])

  const tests = React.useMemo(() => listTestsForClass(klass, section).slice(0, 5), [klass, section])
  const overallCategories = tests
  const overallSeries: LineSeries[] = React.useMemo(() => [
    {
      name: 'Overall %',
      color: '#2563eb',
      data: overallCategories.map(test => {
        const totals = readTotalsByTest(klass, section, test)
        const sum = totals.reduce((s, t) => s + t.sum, 0)
        const total = totals.reduce((s, t) => s + t.total, 0)
        return total ? Math.round((sum * 100) / total) : 0
      }),
    },
  ], [klass, section, overallCategories])

  const subjects = React.useMemo(() => {
    const list = getClassSubjects(klass, section)
    if (list.length) return list
    return getSubjects().slice(0, 6)
  }, [klass, section])

  const subjectSeries: LineSeries[] = React.useMemo(() => {
    const slice = tests.slice(0, 3)
    const palette = ['#10b981', '#ef4444', '#f59e0b']
    return slice.map((test, idx) => {
      const map = new Map(subjectAveragesForTest(klass, section, test).map(x => [x.subject.toLowerCase(), x.pct]))
      return {
        name: test,
        color: palette[idx % palette.length],
        data: subjects.map(subject => map.get(subject.toLowerCase()) ?? null),
      }
    })
  }, [klass, section, subjects, tests])

  const teacherFor = (subject: string) => TEACHERS.find(t => t.subject.toLowerCase() === subject.toLowerCase())?.name || 'Teacher'
  const teacherSubjects = React.useMemo(() => {
    const byMap = new Map(TEACHERS.map(t => [t.subject.toLowerCase(), t.name]))
    return subjects.filter(s => byMap.get(s.toLowerCase()) === teacher)
  }, [subjects, teacher])
  const teacherCategories = overallCategories
  const teacherSeries: LineSeries[] = React.useMemo(() => {
    const palette = ['#0ea5e9', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b']
    return teacherSubjects.map((subj, idx) => ({
      name: subj,
      color: palette[idx % palette.length],
      data: teacherCategories.map(test => {
        const list = subjectAveragesForTest(klass, section, test)
        const found = list.find(x => x.subject.toLowerCase() === subj.toLowerCase())
        return found ? found.pct : null
      }),
    }))
  }, [klass, section, teacherSubjects, teacherCategories])
  const teacherOverallSeries: LineSeries[] = React.useMemo(() => [
    {
      name: 'Teacher overall %',
      color: '#334155',
      data: teacherCategories.map(test => {
        const list = subjectAveragesForTest(klass, section, test)
        const vals = list.filter(x => teacherSubjects.map(s => s.toLowerCase()).includes(x.subject.toLowerCase())).map(x => x.pct)
        if (!vals.length) return null
        const avg = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length)
        return avg
      })
    }
  ], [klass, section, teacherSubjects, teacherCategories])

  return (
    <div className="dash">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark"><span className="dot" /><strong>Performance Analytics</strong></div>
          <div className="actions">
            <Link className="btn-ghost" href="/principal/dashboard">Back</Link>
          </div>
        </div>
      </div>
      <div className="dash-wrap">
        <div className="greeting">Class-wise and subject-wise averages with quick visuals.</div>
        <div className="grid" style={{ alignItems: 'start', marginTop: 12 }}>
          <section className="cal" aria-label="Filters">
            <div className="cal-head"><div className="cal-title">Filters</div></div>
            <div style={{ padding: 18, display: 'grid', gap: 10 }}>
              <div className="row">
                <select className="input select" value={klass} onChange={e => setKlass(e.target.value)}>
                  {getClasses().map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="input select" value={section} onChange={e => setSection(e.target.value)}>
                  {getSectionsForClass(klass).map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="input select" value={teacher} onChange={e => setTeacher(e.target.value)}>
                  {TEACHERS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="note">Showing latest two tests in subject comparison, up to five in overall.</div>
            </div>
          </section>

          <aside className="events">
            <div className="events-head">Class-wise Overall (%)</div>
            <div style={{ padding: 12 }}>
              {overallCategories.length === 0 ? (
                <div className="note-card note-blue">No tests recorded yet.</div>
              ) : (
                <LineChart title="Overall performance per test" categories={overallCategories} series={overallSeries} yMax={100} />
              )}
            </div>
          </aside>
        </div>

        <div className="grid" style={{ marginTop: 18 }}>
          <section className="cal" aria-label="Subject averages">
            <div className="cal-head"><div className="cal-title">Subject averages</div></div>
            <div style={{ padding: 18 }}>
              {subjects.length === 0 ? (
                <div className="note">No subjects configured.</div>
              ) : (
                <LineChart title="Subjects vs tests" categories={subjects} series={subjectSeries} yMax={100} />
              )}
            </div>
            <div className="note-list" style={{ marginTop: 10 }}>
              {subjects.map(sub => (
                <div key={sub} className="note-card note-violet" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="note-title">{sub}</div>
                    <small>{teacherFor(sub)}</small>
                  </div>
                  <div style={{ fontWeight: 800 }}>{subjects.indexOf(sub) + 1} / {subjects.length}</div>
                </div>
              ))}
            </div>
          </section>
          <aside className="events">
            <div className="events-head">Teacher performance: {teacher || 'Select'}</div>
            <div style={{ padding: 12, display:'grid', gap:12 }}>
              {teacherCategories.length === 0 ? (
                <div className="note-card note-blue">No tests recorded yet.</div>
              ) : teacherSubjects.length === 0 ? (
                <div className="note-card note-orange">No subjects mapped to this teacher in this class/section.</div>
              ) : (
                <>
                  <LineChart title="Teacher subjects across tests (%)" categories={teacherCategories} series={teacherSeries} yMax={100} />
                  <LineChart title="Teacher overall average per test (%)" categories={teacherCategories} series={teacherOverallSeries} yMax={100} />
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
