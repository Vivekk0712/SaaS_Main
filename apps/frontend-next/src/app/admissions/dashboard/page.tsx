"use client"
import React from 'react'
import ThemeToggle from '../../theme-toggle'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

export default function AdmissionsDashboard() {
  const [tab, setTab] = React.useState<'submitted'|'approved'>('submitted')
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<{ totalApps:number; submitted:number; confirmed:number; feesSet:number } | null>(null)

  const firstRef = React.useRef(true)
  const load = async (background = false) => {
    try {
      if (firstRef.current && !background) setLoading(true)
      // local-first for instant view
      try { const rl = await fetch(`/api/local/staff/applications?status=${tab === 'approved' ? 'approved' : 'submitted'}`); const j = await rl.json(); setItems(j.items || []) } catch { setItems([]) }
      try { const s = await (await fetch('/api/local/staff/overview')).json(); setStats(s) } catch {}
      // remote refresh in background
      try {
        const status = tab === 'approved' ? 'approved' : 'submitted'
        const r = await fetch(`${API}/v1/onboarding/staff/applications?status=${status}`, { headers: { 'x-role': 'admissions', 'x-password': '12345' } })
        if (r.ok) { const j = await r.json(); setItems((prev)=> j.items || prev) }
      } catch {}
    } finally { if (firstRef.current) { setLoading(false); firstRef.current = false } }
  }
  React.useEffect(() => { load(false) }, [tab])
  // Live refresh via meta version
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
  }, [tab])

  const confirm = async (id: string) => {
    try {
      const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}/confirm`, { method: 'POST', headers: { 'x-role': 'admissions', 'x-password': '12345' } })
      if (!r.ok) throw new Error('remote_err')
    } catch {
      await fetch(`/api/local/staff/applications/${id}/confirm`, { method: 'POST' })
    }
    await load()
  }

  const setFees = async (id: string) => {
    const tuition = Number(prompt('Tuition fee amount?') || '0')
    const transport = Number(prompt('Transport fee amount?') || '0')
    const misc = Number(prompt('Misc fee amount?') || '0')
    const items = [
      { label: 'Tuition', amount: tuition },
      { label: 'Transport', amount: transport },
      { label: 'Misc', amount: misc },
    ]
    try {
      const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-role': 'admissions', 'x-password': '12345' }, body: JSON.stringify({ items }) })
      if (!r.ok) throw new Error('remote_err')
    } catch {
      await fetch(`/api/local/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items }) })
    }
    await load()
  }

  return (
    <div style={{ padding: 24 }}>
      <ThemeToggle darkLabel="Dark" lightLabel="Light" />
      <div className="card" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 className="title">Admissions</h1>
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <div style={{ display:'flex', gap: 8 }}>
            <button className={`btn-ghost${tab==='submitted'?' secondary':''}`} onClick={()=>setTab('submitted')}>Submitted</button>
            <button className={`btn-ghost${tab==='approved'?' secondary':''}`} onClick={()=>setTab('approved')}>Approved</button>
          </div>
          {tab==='submitted' && (
            <button className="btn" onClick={async()=>{ await fetch('/api/local/staff/applications/delete-submitted', { method:'POST' }); await load() }}>Delete All Submitted</button>
          )}
        </div>
        {stats && (
          <div className="stats">
            <div className="stat violet"><div className="label">Submitted (Total Received)</div><div className="value" suppressHydrationWarning>{stats.submitted}</div></div>
            <div className="stat green"><div className="label">Admissions Confirmed</div><div className="value" suppressHydrationWarning>{stats.confirmed}</div></div>
            <div className="stat orange"><div className="label">Fees Finalized</div><div className="value" suppressHydrationWarning>{stats.feesSet}</div></div>
            <div className="stat blue"><div className="label">All Applications</div><div className="value" suppressHydrationWarning>{stats.totalApps}</div></div>
          </div>
        )}
        {loading ? <p className="subtitle">Loading…</p> : (
          <table className="table">
            <thead>
              <tr>
                <th align="left">{tab==='approved' ? 'Updated' : 'Submitted'}</th>
                <th align="left">Student</th>
                <th align="left">Grade</th>
                <th align="left">Parent Phone</th>
                <th align="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const appId = String(it._id || it.id)
                const stu = `${it.data?.student?.firstName||''} ${it.data?.student?.lastName||''}`.trim()
                return (
                  <tr key={appId} style={{ borderTop: '1px solid var(--panel-border)' }}>
                    <td>{new Date(it.updatedAt || it.createdAt).toLocaleString()}</td>
                    <td>{stu || '-'}</td>
                    <td>{it.data?.admission?.grade || '-'}</td>
                    <td>{it.parentPhone}</td>
                    <td style={{ textAlign: 'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
                      <a className="btn-ghost" href={`/admissions/application/${appId}`} style={{ textDecoration: 'none' }}>View</a>
                      {tab==='submitted' && (
                        <>
                          <button className="btn-ghost" onClick={() => confirm(appId)}>Approve</button>
                          <button className="btn-ghost" onClick={() => setFees(appId)}>Quick Add Fees</button>
                        </>
                      )}
                      <button className="btn-ghost" onClick={async()=>{ if (!confirm('Delete this application?')) return; await fetch(`/api/local/staff/applications/${appId}/delete`, { method:'POST' }); await load() }}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
