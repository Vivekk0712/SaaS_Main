"use client"
import React from 'react'
import { getSectionsForClass, getSections } from '../../teacher/data'

type Row = { name:string; grade:string; section:string; roll:string; fatherPhone:string; parentName:string; photo:string }

export default function StudentsManager() {
  const [all, setAll] = React.useState<Row[]>([])
  const [q, setQ] = React.useState('')
  const [grade, setGrade] = React.useState('')
  const [section, setSection] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const load = async () => {
    try {
      const j = await (await fetch('/api/mysql/profiles/students')).json()
      const items: Row[] = (j.items || []).map((s: any) => ({
        name: String(s.name || ''),
        grade: String(s.grade || ''),
        section: String(s.section || ''),
        roll: String(s.usn || s.roll || ''),
        fatherPhone: String(s.parentPhone || ''),
        parentName: String(s.parentName || ''),
        photo: ''
      }))
      setAll(items)
    } catch {
      setAll([])
    }
  }
  React.useEffect(() => { load(); const id = setInterval(load, 3000); return () => clearInterval(id) }, [])

  const grades = Array.from(new Set(all.map(x=>x.grade).filter(Boolean)))
  // Prefer configured sections for the selected class; fall back to discovered sections and finally to defaults
  const sections = React.useMemo(() => {
    if (grade) {
      const preset = getSectionsForClass(grade)
      if (Array.isArray(preset) && preset.length) return preset
      const global = getSections()
      if (Array.isArray(global) && global.length) return global
      return ['A','B']
    }
    const discovered = Array.from(new Set(all.map(x=>x.section).filter(Boolean)))
    if (discovered.length) return discovered
    const global = getSections()
    if (Array.isArray(global) && global.length) return global
    return ['A','B']
  }, [grade, all])
  const filtered = all.filter(r => (!grade || r.grade===grade) && (!section || r.section===section) && (!q || [r.name,r.roll,r.parentName,r.fatherPhone].join(' ').toLowerCase().includes(q.toLowerCase())))

  const setField = (idx: number, key: 'roll'|'section'|'grade', value: string) => setAll(prev => prev.map((r,i) => i===idx ? { ...r, [key]: value } : r))

  const persist = async (rows: Row[]) => {
    setSaving(true)
    try {
      const updates = rows.map(r => ({ name: r.name, fatherPhone: r.fatherPhone, roll: r.roll, section: r.section, grade: r.grade }))
      await fetch('/api/local/profiles/students/update', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ updates }) })
      // Also sync to legacy roster for teacher pages
      try {
        const roster = rows.filter(r => r.roll && r.grade).map(r => ({ usn: r.roll, name: r.name, klass: r.grade, section: r.section || '' }))
        const raw = localStorage.getItem('school:students')
        const base = raw ? JSON.parse(raw) : []
        const byKey = (x:any) => `${x.usn}`
        const map:any = {}; (base||[]).forEach((s:any)=> map[byKey(s)] = s)
        roster.forEach(s=> { map[byKey(s)] = s })
        const out = Object.values(map)
        localStorage.setItem('school:students', JSON.stringify(out))
        try { window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:students' } })) } catch {}
      } catch {}
      await load()
    } finally { setSaving(false) }
  }

  const save = async () => { await persist(all) }

  const syncFromOnboarding = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/local/profiles/sync-from-onboarding', { method: 'POST' })
      const result = await response.json()
      if (result.ok) {
        alert(`Synced ${result.synced} new students from onboarding service`)
        await load()
      } else {
        alert('Sync failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      if (error instanceof Error) {
        alert('Sync failed: ' + error.message)
      } else {
        alert('Sync failed: ' + String(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const generateRolls = async () => {
    if (!grade) { alert('Select Class first'); return }
    const targetSection = section || (sections[0] || 'A')
    const prefix = prompt(`Enter fixed prefix for roll numbers for ${grade} ${targetSection} (e.g., ${grade.replace(/\D/g,'')}${targetSection})`) || ''
    if (!prefix.trim()) return
    
    // Find all students in the selected grade and section (not just filtered ones)
    const studentsInSection = all
      .map((student, index) => ({ student, index }))
      .filter(({ student }) => student.grade === grade && (student.section === targetSection || !student.section))
    
    if (studentsInSection.length === 0) {
      alert(`No students found in ${grade} ${targetSection}`)
      return
    }
    
    // Sort by name for deterministic order
    studentsInSection.sort((a, b) => a.student.name.localeCompare(b.student.name))
    
    // Generate roll numbers
    const nextAll = [...all]
    studentsInSection.forEach(({ index }, idx) => {
      const roll = `${prefix}${String(idx+1).padStart(2, '0')}`
      nextAll[index] = { ...nextAll[index], roll, section: nextAll[index].section || targetSection }
    })
    
    setAll(nextAll)
    await persist(nextAll)
    alert(`Generated ${studentsInSection.length} roll numbers for ${grade} ${targetSection}`)
  }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row" style={{ justifyContent:'space-between' }}>
        <div className="row" style={{ flex: 1 }}>
          <input className="input" placeholder="Search name / roll / phone" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}} />
          <select className="input select" value={grade} onChange={e=>{ setGrade(e.target.value); setSection('') }}>
            <option value="">All Classes</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="input select" value={section} onChange={e=>setSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s || '-'}</option>)}
          </select>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn-ghost" style={{ width: 'auto' }} onClick={syncFromOnboarding} disabled={saving}>Sync from Onboarding</button>
          <button className="btn-ghost" style={{ width: 'auto' }} onClick={generateRolls}>Generate Roll Numbers</button>
          <button className="btn" style={{ width: 'auto' }} onClick={save} disabled={saving}>{saving? 'Saving…' : 'Save Assignments'}</button>
        </div>
      </div>

      <table className="table" style={{ marginTop: 8 }}>
        <thead><tr><th>Name</th><th>Class</th><th>Section</th><th>Roll</th><th>Parent</th><th>Phone</th></tr></thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td>
                <input className="input" value={r.grade} onChange={e=>setField(i,'grade',e.target.value)} style={{maxWidth:140}} />
              </td>
              <td>
                <select className="input select" value={r.section} onChange={e=>setField(i,'section',e.target.value)} style={{maxWidth:140}}>
                  <option value="">Select</option>
                  {(r.grade ? (getSectionsForClass(r.grade).length ? getSectionsForClass(r.grade) : (getSections().length ? getSections() : ['A','B'])) : sections).map((s:string)=> (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <input className="input" value={r.roll} onChange={e=>setField(i,'roll',e.target.value)} style={{maxWidth:120}} />
              </td>
              <td>{r.parentName || '—'}</td>
              <td>{r.fatherPhone}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{color:'#6b7280'}}>No students match this filter.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
