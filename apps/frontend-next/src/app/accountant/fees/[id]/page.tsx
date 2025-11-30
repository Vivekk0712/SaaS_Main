"use client"
import React from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type FeeItem = { label: string; amount: number }

export default function AccountantFeeEditPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [summary, setSummary] = React.useState<{ name:string; grade:string } | null>(null)
  const [items, setItems] = React.useState<FeeItem[]>([])
  const [instCount, setInstCount] = React.useState<number>(1)
  const [instParts, setInstParts] = React.useState<number[]>([])
  const [instDue, setInstDue] = React.useState<string[]>([])
  const [gapMonths, setGapMonths] = React.useState<number>(6)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const load = async () => {
    try {
      setLoading(true)
      let j: any = null
      try {
        const r = await fetch(`${API}/v1/onboarding/staff/fees`, { headers: { 'x-role': 'accountant', 'x-password': '12345' } })
        j = await r.json()
      } catch {
        const rl = await fetch(`/api/local/staff/fees`)
        j = await rl.json()
      }
      const entry = (j.items || []).find((x: any) => String(x.appId || x._id) === id)
      setItems(entry?.items || [])
      if (entry?.app) setSummary({ name: `${entry.app?.data?.student?.firstName||''} ${entry.app?.data?.student?.lastName||''}`.trim(), grade: String(entry.app?.data?.admission?.grade||'') })
      const ins: any = entry?.installments
      if (Array.isArray(ins)) {
        const parts = ins.map((p: any) => Number(p.amount || 0))
        setInstCount(parts.length || 1)
        setInstParts(parts)
        setInstDue(ins.map((p:any)=> (p.dueDate? String(p.dueDate).slice(0,10) : '')))
      } else if (ins && Array.isArray(ins.parts)) {
        const parts = ins.parts.map((p: any) => Number(p.amount || p || 0))
        setInstCount(Number(ins.count || parts.length || 1))
        setInstParts(parts)
        setInstDue(ins.parts.map((p:any)=> (p.dueDate? String(p.dueDate).slice(0,10) : '')))
      }
    } catch { setItems([]) } finally { setLoading(false) }
  }
  React.useEffect(() => { load() }, [id])

  const addRow = () => setItems(prev => [...prev, { label: '', amount: 0 }])
  const rmRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const upd = (i: number, patch: Partial<FeeItem>) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const total = items.reduce((s, it) => s + Number(it.amount || 0), 0)
  const recomputeInstallments = React.useCallback((count: number, t: number) => {
    const c = Math.max(1, Math.floor(Number(count) || 1))
    const base = Math.floor((t / c) * 100) / 100
    const parts = Array.from({ length: c }, () => base)
    const diff = +(t - parts.reduce((s, a) => s + a, 0)).toFixed(2)
    if (diff !== 0 && parts.length) parts[parts.length - 1] = +(parts[parts.length - 1] + diff).toFixed(2)
    setInstCount(c)
    setInstParts(parts)
  }, [])
  React.useEffect(() => {
    if (instParts.length === 0 || instParts.length !== instCount) {
      recomputeInstallments(instCount, total)
    }
  }, [instCount, total])
  React.useEffect(() => {
    const today = new Date()
    const dates: string[] = []
    for (let i=0;i<instCount;i++) { const d = new Date(today); d.setMonth(d.getMonth() + (i*gapMonths)); dates.push(d.toISOString().slice(0,10)) }
    setInstDue(dates)
  }, [gapMonths])

  const save = async () => {
    try {
      setSaving(true)
      try {
        const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-role': 'accountant', 'x-password': '12345' }, body: JSON.stringify({ items, total, installments: instParts.map((a,i)=>({ label: `Installment ${i+1}`, amount: a, dueDate: instDue[i]||null })) }) })
        if (!r.ok) throw new Error('remote_err')
      } catch {
        await fetch(`/api/local/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items, total, installments: { count: instCount, parts: instParts.map((a,i)=>({ label: `Installment ${i+1}`, amount: a, dueDate: instDue[i]||null })) } }) })
      }
      await load()
      alert('Saved')
    } finally { setSaving(false) }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 980 }}>
        <h1 className="title">Edit Fees {summary ? `• ${summary.name} • Grade ${summary.grade}` : ''}</h1>
        {loading ? <p className="subtitle">Loading…</p> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th align="left">Particular</th><th align="right">Amount</th><th></th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--panel-border)' }}>
                    <td><input className="input" value={it.label} onChange={e=>upd(i,{label:e.target.value})} /></td>
                    <td align="right"><input className="input" value={it.amount} onChange={e=>upd(i,{amount:Number(e.target.value||0)})} /></td>
                    <td><button className="btn-ghost" type="button" onClick={()=>rmRow(i)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="actions" style={{ justifyContent:'space-between' }}>
              <button className="btn-ghost" type="button" onClick={addRow}>Add Row</button>
              <div style={{ fontWeight:700 }}>Total: {total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
            </div>
          <div className="actions">
            <button className="btn" type="button" onClick={save} disabled={saving}>{saving? 'Saving…':'Save'}</button>
            <button className="btn" type="button" onClick={async()=>{ await fetch(`/api/local/staff/applications/${id}/fees/confirm`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ role:'accountant' }) }); alert('Fees confirmed by Accountant') }}>Confirm Fees</button>
          </div>
          <div className="actions" style={{ justifyContent:'space-between' }}>
            <div className="field" style={{ maxWidth: 280 }}>
              <span className="label">Installments</span>
              <input className="input" type="number" min={1} value={instCount} onChange={e=>setInstCount(Number(e.target.value||1))} />
            </div>
            <div className="field" style={{ maxWidth: 280 }}>
              <span className="label">Next installment after (months)</span>
              <input className="input" type="number" min={1} value={gapMonths} onChange={e=>setGapMonths(Number(e.target.value||1))} />
            </div>
            {instParts.length>1 && (<div className="badge info">Split equally into {instParts.length}</div>)}
          </div>
          {instParts.length>0 && (
            <table className="table" style={{ marginTop: 8 }}>
              <thead><tr><th align="left">Installment</th><th align="right">Amount</th><th align="left">Due Date</th></tr></thead>
              <tbody>
                {instParts.map((a,i)=> (
                  <tr key={i}>
                    <td>Installment {i+1}</td>
                    <td align="right"><input className="input" style={{maxWidth:160}} value={a} onChange={e=>setInstParts(prev=> prev.map((v,idx)=> idx===i? Number(e.target.value||0): v))} /></td>
                    <td><input type="date" className="input" value={instDue[i]||''} onChange={e=>setInstDue(prev=> prev.map((v,idx)=> idx===i? e.target.value : v))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </>
        )}
      </div>
    </div>
  )
}
