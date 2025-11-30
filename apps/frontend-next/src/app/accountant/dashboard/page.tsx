"use client"
import React from 'react'
import ThemeToggle from '../../theme-toggle'
import { getClasses, getSectionsForClass } from '../../teacher/data'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

export default function AccountantDashboard() {
  const [tab, setTab] = React.useState<'fees'|'adhoc'|'students'>('fees')
  const [items, setItems] = React.useState<any[]>([])
  const [adhoc, setAdhoc] = React.useState<any[]>([])
  const [students, setStudents] = React.useState<any[]>([])
  const [studentFilter, setStudentFilter] = React.useState<'all'|'paid'|'unpaid'|'today'|'week'|'month'>('all')
  const [studentQuery, setStudentQuery] = React.useState('')
  const [studentNameFilter, setStudentNameFilter] = React.useState('')
  const [studentPhoneFilter, setStudentPhoneFilter] = React.useState('')
  const [studentClassFilter, setStudentClassFilter] = React.useState('')
  const [studentSectionFilter, setStudentSectionFilter] = React.useState('')
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [newTitle, setNewTitle] = React.useState('')
  const [newPurpose, setNewPurpose] = React.useState('')
  const [rows, setRows] = React.useState<Array<{ label: string; amount: number }>>([{ label: '', amount: 0 }])
  const [targetType, setTargetType] = React.useState<'student'|'class'|'section'|'classes'>('student')
  const [targetStudentName, setTargetStudentName] = React.useState('')
  const [targetParentPhone, setTargetParentPhone] = React.useState('')
  const [targetGrade, setTargetGrade] = React.useState('')
  const [targetSection, setTargetSection] = React.useState('')
  const [targetGrades, setTargetGrades] = React.useState<string>('')
  const [preview, setPreview] = React.useState<Array<{ appId:string; name:string; grade:string; section:string; parentPhone:string }> | null>(null)
  const [previewLoading, setPreviewLoading] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const firstRef = React.useRef(true)
  const load = async (background = false) => {
    try {
      if (firstRef.current && !background) setLoading(true)
      // local-first for instant view
      try { const rl = await fetch(`/api/local/staff/fees`); const j = await rl.json(); setItems(j.items || []) } catch { setItems([]) }
      // background refresh from remote
      try { const r = await fetch(`${API}/v1/onboarding/staff/fees`, { headers: { 'x-role': 'accountant', 'x-password': '12345' } }); if (r.ok) { const j = await r.json(); setItems(prev => j.items || prev) } } catch {}
      // adhoc
      try { const a = await fetch('/api/local/accounting/adhoc'); const aj = await a.json(); setAdhoc(aj.items || []) } catch { setAdhoc([]) }
      // students - fetch from MySQL and adhoc bills
      try {
        const rl = await fetch(`/api/mysql/profiles/students`)
        const sj = await rl.json()
        
        // Fetch adhoc bills to calculate pending amounts
        const billsRes = await fetch('/api/debug/adhoc-bills')
        const billsData = await billsRes.json()
        const bills = billsData.adhocBills || []
        
        // Transform MySQL data and add fee information
        const studentsData = (sj.items || []).map((s: any) => {
          // Find all bills for this student (by parent phone)
          const studentBills = bills.filter((b: any) => b.parentPhone === s.parentPhone)
          const unpaidBills = studentBills.filter((b: any) => b.status !== 'paid')
          const paidBills = studentBills.filter((b: any) => b.status === 'paid')
          
          const totalPending = unpaidBills.reduce((sum: number, b: any) => sum + Number(b.total || 0), 0)
          const totalPaid = paidBills.reduce((sum: number, b: any) => sum + Number(b.total || 0), 0)
          const totalFees = totalPending + totalPaid
          
          return {
            name: s.name,
            usn: s.usn,
            grade: s.grade,
            section: s.section,
            fatherPhone: s.parentPhone,
            parentName: s.parentName,
            paid: unpaidBills.length === 0 && paidBills.length > 0,
            feeTotal: totalFees,
            feePending: totalPending,
            feePaid: totalPaid,
            billsCount: studentBills.length,
            unpaidCount: unpaidBills.length,
            appId: s.usn
          }
        })
        setStudents(studentsData)
      } catch (err) { 
        console.error('Failed to load students:', err)
        setStudents([]) 
      }
    } catch { setItems([]) } finally { if (firstRef.current) { setLoading(false); firstRef.current = false } }
  }
  React.useEffect(() => { load(false) }, [])
  React.useEffect(() => {
    let alive = true
    let lastV = 0
    let timer: any
    const visible = () => typeof document !== 'undefined' && document.visibilityState === 'visible'
    const tick = async () => {
      try { const m = await (await fetch('/api/local/meta/version')).json(); if (!alive) return; if (typeof m?.version === 'number' && m.version !== lastV) { lastV = m.version; load(true) } } catch {}
    }
    const loop = async () => {
      if (!alive) return
      if (visible()) await tick()
      timer = setTimeout(loop, visible() ? 6000 : 12000)
    }
    loop()
    const onVis = () => { if (visible()) { clearTimeout(timer); loop() } }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  React.useEffect(() => { (async()=>{
    // refresh only students on filter change - fetch from MySQL and bills
    try {
      const rl = await fetch(`/api/mysql/profiles/students`)
      const sj = await rl.json()
      
      // Fetch adhoc bills
      const billsRes = await fetch('/api/debug/adhoc-bills')
      const billsData = await billsRes.json()
      const bills = billsData.adhocBills || []
      
      // Transform MySQL data and add fee information
      const studentsData = (sj.items || []).map((s: any) => {
        const studentBills = bills.filter((b: any) => b.parentPhone === s.parentPhone)
        const unpaidBills = studentBills.filter((b: any) => b.status !== 'paid')
        const paidBills = studentBills.filter((b: any) => b.status === 'paid')
        
        const totalPending = unpaidBills.reduce((sum: number, b: any) => sum + Number(b.total || 0), 0)
        const totalPaid = paidBills.reduce((sum: number, b: any) => sum + Number(b.total || 0), 0)
        const totalFees = totalPending + totalPaid
        
        return {
          name: s.name,
          usn: s.usn,
          grade: s.grade,
          section: s.section,
          fatherPhone: s.parentPhone,
          parentName: s.parentName,
          paid: unpaidBills.length === 0 && paidBills.length > 0,
          feeTotal: totalFees,
          feePending: totalPending,
          feePaid: totalPaid,
          billsCount: studentBills.length,
          unpaidCount: unpaidBills.length,
          appId: s.usn
        }
      })
      
      // Apply filter
      let filtered = studentsData
      if (studentFilter === 'paid') filtered = studentsData.filter(s => s.paid)
      if (studentFilter === 'unpaid') filtered = studentsData.filter(s => s.unpaidCount > 0)
      
      setStudents(filtered)
    } catch { setStudents([]) }
  })() }, [studentFilter])

  const totalAmount = items.reduce((s, it: any) => s + Number(it.total || 0), 0)
  return (
    <div style={{ padding: 24 }}>
      <ThemeToggle darkLabel="Dark" lightLabel="Light" />
      <div className="card" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 className="title">Accountant — Fees Overview</h1>
        <div className="actions" style={{ justifyContent:'space-between' }}>
          <div>
            <button className={`btn-ghost${tab==='fees'?' secondary':''}`} onClick={()=>setTab('fees')}>Approved Fees</button>
            <button className={`btn-ghost${tab==='adhoc'?' secondary':''}`} onClick={()=>setTab('adhoc')}>Ad-hoc Fees</button>
            <button className={`btn-ghost${tab==='students'?' secondary':''}`} onClick={()=>setTab('students')}>Students</button>
          </div>
        </div>
        {!loading && (
          <div className="stats">
            <div className="stat blue"><div className="label">Fee Entries</div><div className="value" suppressHydrationWarning>{items.length}</div></div>
            <div className="stat green"><div className="label">Total Amount</div><div className="value" suppressHydrationWarning>{totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div></div>
            <div className="stat orange"><div className="label">Pending Confirms</div><div className="value">—</div></div>
            <div className="stat violet"><div className="label">Notes</div><div className="value">All data synced</div></div>
          </div>
        )}
        {loading ? <p className="subtitle">Loading…</p> : tab==='fees' ? (
          <table className="table">
            <thead>
              <tr><th align="left">Updated</th><th align="left">Student</th><th align="left">Grade</th><th align="left">Parent</th><th align="left">Next Due</th><th align="right">Total</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const ins:any = (it as any).installments
                let nextDueText = '—'
                if (Array.isArray(ins) && ins.length) {
                  nextDueText = `${Number(ins[0]?.amount||0).toLocaleString('en-IN',{style:'currency',currency:'INR'})}${ins[0]?.dueDate? ' • ' + new Date(ins[0].dueDate).toLocaleDateString():''}`
                } else if (ins && Array.isArray(ins.parts) && ins.parts.length) {
                  const p0:any = ins.parts[0]
                  const amt = typeof p0 === 'object' ? (p0.amount||0) : p0
                  const d = (typeof p0 === 'object' && p0.dueDate)? new Date(p0.dueDate).toLocaleDateString(): ''
                  nextDueText = `${Number(amt||0).toLocaleString('en-IN',{style:'currency',currency:'INR'})}${d? ' • ' + d:''}`
                }
                return (
                <tr key={String(it.appId || it._id)} style={{ borderTop: '1px solid var(--panel-border)' }}>
                  <td>{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : '-'}</td>
                  <td>{`${it.app?.data?.student?.firstName||''} ${it.app?.data?.student?.lastName||''}`.trim()}</td>
                  <td>{it.app?.data?.admission?.grade || '-'}</td>
                  <td>{it.app?.parentPhone}</td>
                  <td>{nextDueText}</td>
                  <td style={{ textAlign: 'right' }}>{Number(it.total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td style={{ textAlign: 'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <a className="btn-ghost" href={`/accountant/fees/${String(it.appId || it._id)}`}>Edit Fees</a>
                    <button className="btn-ghost" onClick={async()=>{ const appId = String(it.appId || it._id); if(!confirm('Delete this application?')) return; await fetch(`/api/local/staff/applications/${appId}/delete`, { method:'POST' }); await load() }}>Delete</button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        ) : tab==='adhoc' ? (
          <div>
            <h3 className="title" style={{ fontSize: 18 }}>Create Ad-hoc Fee</h3>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field"><span className="label">Title</span><input className="input" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Exam Fee" /></div>
              <div className="field"><span className="label">Purpose/Note</span><input className="input" value={newPurpose} onChange={e=>setNewPurpose(e.target.value)} placeholder="Optional" /></div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="field"><span className="label">Target Type</span>
                <select className="input select" value={targetType} onChange={e=>setTargetType(e.target.value as any)}>
                  <option value="student">Student</option>
                  <option value="class">Class</option>
                  <option value="section">Section</option>
                  <option value="classes">Multiple Classes</option>
                </select>
              </div>
              {targetType==='student' && (
                <>
                  <div className="field"><span className="label">Student Name</span><input className="input" list="student-names" value={targetStudentName} onChange={e=>setTargetStudentName(e.target.value)} placeholder="e.g. Rahul Sharma" /></div>
                  <div className="field"><span className="label">Parent Phone</span><input className="input" value={targetParentPhone} onChange={e=>setTargetParentPhone(e.target.value)} placeholder="e.g. +91 98xxxxxxx" /></div>
                </>
              )}
              {targetType==='class' && (
                <div className="field"><span className="label">Class</span>
                  <select className="input select" value={targetGrade} onChange={e=>setTargetGrade(e.target.value)}>
                    <option value="">Select Class</option>
                    {getClasses().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {targetType==='section' && (
                <>
                  <div className="field"><span className="label">Class</span>
                    <select className="input select" value={targetGrade} onChange={e=>{ setTargetGrade(e.target.value); setTargetSection('') }}>
                      <option value="">Select Class</option>
                      {getClasses().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field"><span className="label">Section</span>
                    <select className="input select" value={targetSection} onChange={e=>setTargetSection(e.target.value)} disabled={!targetGrade}>
                      <option value="">Select Section</option>
                      {(targetGrade ? getSectionsForClass(targetGrade) : []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}
              {targetType==='classes' && (
                <div className="field"><span className="label">Grades (comma separated)</span><input className="input" value={targetGrades} onChange={e=>setTargetGrades(e.target.value)} placeholder="e.g. 8,9,10" /></div>
              )}
            </div>
            <table className="table" style={{ marginTop: 8 }}>
              <thead><tr><th align="left">Particular</th><th align="right">Amount</th><th></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}><td><input className="input" value={r.label} onChange={e=>setRows(prev=>prev.map((x,idx)=>idx===i?{...x,label:e.target.value}:x))} /></td><td align="right"><input className="input" value={r.amount} onChange={e=>setRows(prev=>prev.map((x,idx)=>idx===i?{...x,amount:Number(e.target.value||0)}:x))} /></td><td><button className="btn-ghost" onClick={()=>setRows(prev=>prev.filter((_,idx)=>idx!==i))}>Remove</button></td></tr>
                ))}
              </tbody>
            </table>
            <div className="actions" style={{ justifyContent:'space-between' }}>
              <button className="btn-ghost" onClick={()=>setRows(prev=>[...prev,{label:'',amount:0}])}>Add Row</button>
              <div style={{ fontWeight:700 }}>Total: {rows.reduce((s,a)=>s+Number(a.amount||0),0).toLocaleString('en-IN',{style:'currency',currency:'INR'})}</div>
            </div>
            <div className="actions">
              <button className="btn" onClick={async()=>{
                if(!newTitle.trim()) return alert('Enter title')
                let target:any = undefined
                if (targetType==='student') target = { type:'student', studentName: targetStudentName.trim(), parentPhone: targetParentPhone.trim() }
                if (targetType==='class') target = { type:'class', grade: targetGrade.trim() }
                if (targetType==='section') target = { type:'section', grade: targetGrade.trim(), section: targetSection.trim() }
                if (targetType==='classes') target = { type:'classes', grades: targetGrades.split(',').map(s=>s.trim()).filter(Boolean) }
                await fetch('/api/local/accounting/adhoc',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ title:newTitle.trim(), purpose:newPurpose.trim(), items:rows, target })})
                setNewTitle(''); setNewPurpose(''); setRows([{label:'',amount:0}]); setTargetStudentName(''); setTargetParentPhone(''); setTargetGrade(''); setTargetSection(''); setTargetGrades(''); await load()
              }}>Save Ad-hoc Fee</button>
              <button className="btn-ghost" onClick={async()=>{
                const a = adhoc[0]
                if (!a) return alert('No ad-hoc fees yet. Save one first.')
                if (!confirm('Send the most recent ad-hoc fee to matching recipients now?')) return
                try { await fetch(`/api/local/accounting/adhoc/${a.id}/send`, { method:'POST' }); alert('Ad-hoc fee sent.'); await load(true) } catch { alert('Send failed') }
              }}>Send Latest</button>
              <button className="btn-ghost" onClick={async()=>{
                setPreviewLoading(true)
                let target:any = undefined
                if (targetType==='student') target = { type:'student', studentName: targetStudentName.trim(), parentPhone: targetParentPhone.trim() }
                if (targetType==='class') target = { type:'class', grade: targetGrade.trim() }
                if (targetType==='section') target = { type:'section', grade: targetGrade.trim(), section: targetSection.trim() }
                if (targetType==='classes') target = { type:'classes', grades: targetGrades.split(',').map(s=>s.trim()).filter(Boolean) }
                try { const r = await fetch('/api/local/accounting/adhoc/resolve', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ target })}); const j = await r.json(); setPreview(j.items || []); } catch { setPreview([]) } finally { setPreviewLoading(false) }
              }}>Preview Recipients</button>
            </div>
            {/* Student suggestions */}
            {targetType==='student' && (
              <datalist id="student-names">
                {students.map((s:any) => <option key={s.name + s.fatherPhone} value={s.name} />)}
              </datalist>
            )}
            {preview && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="actions" style={{ justifyContent:'space-between' }}>
                  <div className="label">Recipients</div>
                  <div className="badge info">{previewLoading ? 'Loading…' : `${preview.length} found`}</div>
                </div>
                <table className="table" style={{ marginTop: 8 }}>
                  <thead><tr><th align="left">Student</th><th align="left">Grade</th><th align="left">Section</th><th align="left">Parent</th></tr></thead>
                  <tbody>
                    {preview.map((p)=> (
                      <tr key={p.appId}><td>{p.name||'-'}</td><td>{p.grade||'-'}</td><td>{p.section||'-'}</td><td>{p.parentPhone||'-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <h3 className="title" style={{ fontSize: 18, marginTop: 16 }}>Ad-hoc Fees</h3>
            <table className="table">
              <thead><tr><th align="left">Created</th><th align="left">Title</th><th align="left">Target</th><th align="left">Purpose</th><th align="right">Total</th><th align="left">Status</th><th>Actions</th></tr></thead>
              <tbody>
                {adhoc.map((a)=> {
                  const t = a.target
                  let tText = '-'
                  if (t?.type==='student') tText = `Student: ${t.studentName||''} (${t.parentPhone||''})`
                  if (t?.type==='class') tText = `Class: ${t.grade}`
                  if (t?.type==='section') tText = `Section: ${t.grade}-${t.section}`
                  if (t?.type==='classes') tText = `Classes: ${(t.grades||[]).join(', ')}`
                  
                  // Check how many bills were sent
                  const bills = (adhoc as any).bills || []
                  const sentCount = bills.filter((b: any) => b.adhocId === a.id).length
                  
                  return (
                    <tr key={a.id}>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                      <td>{a.title}</td>
                      <td>{tText}</td>
                      <td>{a.purpose||'-'}</td>
                      <td align="right">{Number(a.total||0).toLocaleString('en-IN',{style:'currency',currency:'INR'})}</td>
                      <td>
                        {sentCount > 0 ? (
                          <span className="badge success">Sent to {sentCount} students</span>
                        ) : (
                          <span className="badge warning">Not sent yet</span>
                        )}
                      </td>
                      <td style={{ textAlign:'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <button className="btn-ghost" onClick={async()=>{ 
                          if(!confirm('Send this ad-hoc fee to recipients now?')) return
                          const res = await fetch(`/api/local/accounting/adhoc/${a.id}/send`,{ method:'POST'})
                          const data = await res.json()
                          alert(`Sent to ${data.delivered || 0} students!`)
                          await load(true)
                        }}>Send</button>
                        <button className="btn-ghost" onClick={async()=>{ if(!confirm('Delete ad-hoc fee?')) return; await fetch(`/api/local/accounting/adhoc/${a.id}/delete`,{ method:'POST'}); await load() }}>Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div className="actions" style={{ justifyContent:'space-between' }}>
              <div className="row" style={{ gap: 8, flexWrap:'wrap' }}>
                <select className="select" value={studentFilter} onChange={e=>setStudentFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="paid">Paid (any)</option>
                  <option value="today">Paid Today</option>
                  <option value="week">Paid This Week</option>
                  <option value="month">Paid This Month</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <input
                  className="input"
                  placeholder="Student name"
                  value={studentNameFilter}
                  onChange={e => setStudentNameFilter(e.target.value)}
                  style={{ minWidth: 140 }}
                />
                <input
                  className="input"
                  placeholder="Phone number"
                  value={studentPhoneFilter}
                  onChange={e => setStudentPhoneFilter(e.target.value)}
                  style={{ minWidth: 140 }}
                />
                <select
                  className="select"
                  value={studentClassFilter}
                  onChange={e => {
                    setStudentClassFilter(e.target.value)
                    setStudentSectionFilter('')
                  }}
                >
                  <option value="">All classes</option>
                  {getClasses().map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  value={studentSectionFilter}
                  onChange={e => setStudentSectionFilter(e.target.value)}
                  disabled={!studentClassFilter}
                >
                  <option value="">All sections</option>
                  {studentClassFilter &&
                    getSectionsForClass(studentClassFilter).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
                <input
                  className="input"
                  placeholder="Quick search (name/phone)"
                  value={studentQuery}
                  onChange={e => setStudentQuery(e.target.value)}
                  style={{ minWidth: 160 }}
                />
              </div>
            </div>
            <table className="table">
              <thead><tr><th align="left">Student</th><th align="left">Payment Status</th><th align="left">Pending</th><th align="right">Paid</th><th align="right">Total</th><th>Actions</th></tr></thead>
              <tbody>
                {students
                  .filter(s => !studentNameFilter || String(s.name || '').toLowerCase().includes(studentNameFilter.toLowerCase()))
                  .filter(s => !studentPhoneFilter || String(s.fatherPhone || '').toLowerCase().includes(studentPhoneFilter.toLowerCase()))
                  .filter(s => !studentClassFilter || String(s.grade || '') === studentClassFilter)
                  .filter(s => !studentSectionFilter || String(s.section || '') === studentSectionFilter)
                  .filter(s => !studentQuery || `${s.name} ${s.fatherPhone}`.toLowerCase().includes(studentQuery.toLowerCase()))
                  .map((s: any, i: number) => (
                  <React.Fragment key={i}>
                    <tr style={{ borderTop: '1px solid var(--panel-border)' }}>
                      <td><button className="btn-ghost" onClick={()=> setExpanded(prev=> ({...prev, [s.name + s.fatherPhone]: !prev[s.name + s.fatherPhone]}))}>{s.name}</button></td>
                      <td>
                        {s.unpaidCount > 0 ? (
                          <span className="badge error">🔴 {s.unpaidCount} Unpaid</span>
                        ) : s.billsCount > 0 ? (
                          <span className="badge success">🟢 All Paid</span>
                        ) : (
                          <span className="badge">No Fees</span>
                        )}
                      </td>
                      <td style={{ color: s.feePending > 0 ? '#b91c1c' : undefined, fontWeight: s.feePending > 0 ? 600 : undefined }}>
                        {s.feePending > 0 ? Number(s.feePending).toLocaleString('en-IN',{style:'currency',currency:'INR'}) : '₹0'}
                      </td>
                      <td align="right" style={{ color: s.feePaid > 0 ? '#16a34a' : undefined }}>
                        {s.feePaid > 0 ? Number(s.feePaid).toLocaleString('en-IN',{style:'currency',currency:'INR'}) : '₹0'}
                      </td>
                      <td align="right" style={{ fontWeight: 600 }}>
                        {Number(s.feeTotal||0).toLocaleString('en-IN', { style:'currency', currency:'INR' })}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        {s.billsCount > 0 ? <span className="note">{s.billsCount} bill(s)</span> : <span className="note">—</span>}
                      </td>
                    </tr>
                    {expanded[s.name + s.fatherPhone] && (
                      <tr><td colSpan={6}>
                        <div className="grid cols-3">
                          <div><div className="label">Class</div><div>{s.grade}</div></div>
                          <div><div className="label">Section</div><div>{s.section||'—'}</div></div>
                          <div><div className="label">USN</div><div>{s.usn||'—'}</div></div>
                          <div><div className="label">Parent</div><div>{s.parentName||'—'}</div></div>
                          <div><div className="label">Phone</div><div>{s.fatherPhone}</div></div>
                          <div><div className="label">Bills</div><div>{s.billsCount} total ({s.unpaidCount} unpaid)</div></div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
