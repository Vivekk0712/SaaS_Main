"use client"
import React from 'react'
import ThemeToggle from '../../theme-toggle'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

export default function PrincipalDashboard() {
  const [stats, setStats] = React.useState<{ totalApps:number; submitted:number; confirmed:number; feesSet:number } | null>(null)
  const [fees, setFees] = React.useState<any[]>([])
  const [students, setStudents] = React.useState<any[]>([])
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [studentQuery, setStudentQuery] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  const firstRef = React.useRef(true)
  const load = async (background = false) => {
    try {
      if (firstRef.current && !background) setLoading(true)
      // local-first for correctness
      try {
        const rl = await fetch(`/api/local/staff/overview`)
        const fl = await fetch(`/api/local/staff/fees`)
        const sl = await fetch(`/api/local/profiles/students/with-fees`)
        const o = await rl.json(); const ff = await fl.json()
        const sj = await sl.json()
        setStats(o); setFees(ff.items || []); setStudents(sj.items || [])
      } catch {}
      // refresh in background from remote if available
      try {
        const r = await fetch(`${API}/v1/onboarding/staff/overview`, { headers: { 'x-role': 'principal', 'x-password': '12345' } })
        const f = await fetch(`${API}/v1/onboarding/staff/fees`, { headers: { 'x-role': 'principal', 'x-password': '12345' } })
        if (r.ok && f.ok) {
          const overview = await r.json(); const feesList = await f.json()
          setStats((prev)=> overview || prev)
          setFees((prev)=> (feesList.items || prev))
        }
      } catch {}
    } finally { if (firstRef.current) { setLoading(false); firstRef.current = false } }
  }

  const editFees = async (id: string) => {
    const tuition = Number(prompt('Tuition fee amount?') || '0')
    const transport = Number(prompt('Transport fee amount?') || '0')
    const misc = Number(prompt('Misc fee amount?') || '0')
    const items = [
      { label: 'Tuition', amount: tuition },
      { label: 'Transport', amount: transport },
      { label: 'Misc', amount: misc },
    ]
    try {
      const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-role': 'principal', 'x-password': '12345' }, body: JSON.stringify({ items }) })
      if (!r.ok) throw new Error('remote_err')
    } catch {
      await fetch(`/api/local/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items }) })
    }
    await load()
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

  return (
    <div style={{ padding: 24 }}>
      <ThemeToggle darkLabel="Dark" lightLabel="Light" />
      <div className="card" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="title">Principal Overview</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="btn-ghost" href="/principal/performance">Teacher Performance</a>
            <a className="btn-ghost" href="#students-portal">Students Portal</a>
          </div>
        </div>
        {loading ? <p className="subtitle">Loading…</p> : stats ? (
          <>
            <div className="stats">
              <div className="stat violet"><div className="label">Submitted (Total Received)</div><div className="value" suppressHydrationWarning>{stats.submitted}</div></div>
              <div className="stat green"><div className="label">Admissions Confirmed</div><div className="value" suppressHydrationWarning>{stats.confirmed}</div></div>
              <div className="stat orange"><div className="label">Fees Finalized</div><div className="value" suppressHydrationWarning>{stats.feesSet}</div></div>
              <div className="stat blue"><div className="label">All Applications</div><div className="value" suppressHydrationWarning>{stats.totalApps}</div></div>
            </div>
            <h3 style={{ marginTop: 10 }}>Recent Fees</h3>
            <table className="table">
              <thead>
                <tr><th align="left">Updated</th><th align="left">Student</th><th align="left">Grade</th><th align="left">Parent</th><th align="left">Next Due</th><th align="right">Total</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {fees.map((it: any) => {
                  const ins:any = it?.installments
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
                      <a className="btn-ghost" href={`/principal/application/${String(it.appId || it._id)}`}>View/Edit Application</a>
                      <a className="btn-ghost" href={`/principal/fees/${String(it.appId || it._id)}`}>Edit Fees</a>
                      <button className="btn-ghost" onClick={async()=>{ const appId = String(it.appId || it._id); if(!confirm('Delete this application?')) return; await fetch(`/api/local/staff/applications/${appId}/delete`, { method:'POST' }); await load() }}>Delete</button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
            <h3 style={{ marginTop: 18 }}>Students</h3>
            <div className="actions" style={{ justifyContent:'space-between', marginBottom: 8 }}>
              <input className="input" placeholder="Search name / phone / roll" value={studentQuery} onChange={e=>setStudentQuery(e.target.value)} />
            </div>
            <table className="table">
              <thead><tr><th align="left">Student</th><th align="left">Status</th><th align="left">Due</th><th align="right">Total</th><th>Actions</th></tr></thead>
              <tbody>
                {students.filter(s => {
                  if (!studentQuery.trim()) return true
                  const hay = `${s.name} ${s.fatherPhone} ${s.roll} ${s.grade} ${s.section}`.toLowerCase()
                  return hay.includes(studentQuery.toLowerCase())
                }).map((s: any, i: number) => (
                  <React.Fragment key={i}>
                    <tr style={{ borderTop: '1px solid var(--panel-border)' }}>
                      <td><button className="btn-ghost" onClick={()=> setExpanded(prev=> ({...prev, [s.name + s.fatherPhone]: !prev[s.name + s.fatherPhone]}))}>{s.name}</button></td>
                      <td>{s.paid ? `Paid${s.paidAt ? ' — ' + new Date(s.paidAt).toLocaleDateString() : ''}` : 'Unpaid'}</td>
                      <td>{!s.paid && s.nextDueAmount ? `${Number(s.nextDueAmount||0).toLocaleString('en-IN',{style:'currency',currency:'INR'})}${s.nextDueDate ? ' • ' + new Date(s.nextDueDate).toLocaleDateString() : ''}` : '—'}</td>
                      <td align="right">{Number(s.feeTotal||0).toLocaleString('en-IN', { style:'currency', currency:'INR' })}</td>
                      <td style={{ textAlign:'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
                        {s.appId ? <a className="btn-ghost" href={`/principal/fees/${encodeURIComponent(s.appId)}`}>Edit Fees</a> : null}
                        {s.appId ? <a className="btn-ghost" href={`/principal/application/${encodeURIComponent(s.appId)}`}>View Application</a> : null}
                      </td>
                    </tr>
                    {expanded[s.name + s.fatherPhone] && (
                      <tr><td colSpan={4}>
                        <div className="grid cols-3">
                          <div><div className="label">Class</div><div>{s.grade}</div></div>
                          <div><div className="label">Section</div><div>{s.section||'—'}</div></div>
                          <div><div className="label">Roll</div><div>{s.roll||'—'}</div></div>
                          <div><div className="label">Parent</div><div>{s.parentName||'—'}</div></div>
                          <div><div className="label">Phone</div><div>{s.fatherPhone}</div></div>
                          <div><div className="label">Fee Total</div><div>{Number(s.feeTotal||0).toLocaleString('en-IN', { style:'currency', currency:'INR' })}</div></div>
                          <div><div className="label">Payment</div><div>{s.paid ? `Paid${s.paidAt ? ' on ' + new Date(s.paidAt).toLocaleDateString() : ''}` : 'Unpaid'}</div></div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </>
        ) : <p>No data</p>}
      </div>

      <div id="students-portal" className="card" style={{ maxWidth: 1100, margin: '18px auto 0', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--panel-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 className="title" style={{ fontSize: 18 }}>Students Portal (Embedded)</h2>
          <a className="back" href="http://localhost:3030/" target="_blank" rel="noreferrer">Open in new tab →</a>
        </div>
        <iframe
          src="http://localhost:3030/"
          title="Students Portal"
          style={{ width: '100%', height: '600px', border: 'none' }}
        />
      </div>
    </div>
  )
}
