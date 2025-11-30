"use client"
import React from 'react'

type Row = { name:string; grade:string; section:string; roll:string; parentName:string; parentPhone:string; photo:string }

export default function StudentsBase() {
  const [all, setAll] = React.useState<Row[]>([])
  const [q, setQ] = React.useState('')
  const [grade, setGrade] = React.useState('')
  const [section, setSection] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/students').then(r=>r.json()).then(j=> setAll(j.items || [])).catch(()=> setAll([]))
  }, [])

  const refresh = () => fetch('/api/students').then(r=>r.json()).then(j=> setAll(j.items || [])).catch(()=> setAll([]))
  const wipeAll = async () => {
    if (!confirm('Delete ALL student base data? This cannot be undone.')) return
    try { setBusy(true); await fetch('/api/admin/wipe', { method: 'DELETE' }); await refresh() } finally { setBusy(false) }
  }

  const grades = Array.from(new Set(all.map(x=>x.grade).filter(Boolean)))
  const sections = Array.from(new Set(all.filter(x=>!grade || x.grade===grade).map(x=>x.section).filter(Boolean)))
  const filtered = all.filter(r => (!grade || r.grade===grade) && (!section || r.section===section) && (!q || [r.name,r.roll,r.parentName,r.parentPhone].join(' ').toLowerCase().includes(q.toLowerCase())))

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="title">Student Base</h1>
        <p className="subtitle">Quickly search and filter students. Access for Principal • HOD • Accountant.</p>
        <div className="grid cols-4">
          <div className="stat blue"><div className="label">Total Students</div><div className="value">{all.length}</div></div>
          <div className="stat green"><div className="label">Classes</div><div className="value">{grades.length}</div></div>
          <div className="stat orange"><div className="label">With Roll Numbers</div><div className="value">{all.filter(x=>x.roll).length}</div></div>
          <div className="stat violet"><div className="label">With Photos</div><div className="value">{all.filter(x=>x.photo).length}</div></div>
        </div>
        <div className="row" style={{marginTop:12}}>
          <input className="input" placeholder="Search name / roll / phone" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}} />
          <select className="select" value={grade} onChange={e=>{ setGrade(e.target.value); setSection('') }}>
            <option value="">All Classes</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="select" value={section} onChange={e=>setSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s || '-'}</option>)}
          </select>
          <button className="input" style={{ background:'#fee2e2', borderColor:'#fecaca', color:'#991b1b' }} onClick={wipeAll} disabled={busy}>Delete All</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Roll</th>
              <th>Section</th>
              <th>Parent</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r,i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.grade}</td>
                <td><span className="badge blue">{r.roll || '—'}</span></td>
                <td>{r.section || '—'}</td>
                <td>{r.parentName || '—'}</td>
                <td>{r.parentPhone || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{color:'#6b7280'}}>No students match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
