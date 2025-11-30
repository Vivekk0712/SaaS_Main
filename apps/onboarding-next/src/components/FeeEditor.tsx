"use client"
import React from 'react'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type Role = 'admissions' | 'accountant' | 'principal'
type Item = { label: string; amount: number }
type Installment = { label?: string; dueDate: string; amount: number }

export default function FeeEditor({ appId, role }: { appId: string; role: Role }) {
  const [mounted, setMounted] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [items, setItems] = React.useState<Item[]>([{ label: '', amount: 0 }])
  const [installments, setInstallments] = React.useState<Installment[]>([])
  const [genCount, setGenCount] = React.useState<number>(2)
  const [genGapMonths, setGenGapMonths] = React.useState<number>(6)
  const [genStartDate, setGenStartDate] = React.useState<string>('')
  const [studentName, setStudentName] = React.useState<string>('')
  const [appLoaded, setAppLoaded] = React.useState<boolean>(false)

  const headers = { 'x-role': role, 'x-password': '12345' }

  const load = async () => {
    setLoading(true)
    try {
      // Load fees if present
      const feesUrl = API
        ? `${API}/v1/onboarding/staff/applications/${appId}/fees`
        : `/api/local/staff/applications/${appId}/fees`
      const feesRes = API
        ? await fetch(feesUrl, { headers })
        : await fetch(feesUrl)
      if (feesRes.ok) {
        const fee = await feesRes.json()
        if (Array.isArray(fee.items)) setItems(fee.items)
        if (Array.isArray(fee.installments)) setInstallments(fee.installments)
        else if (fee.installments && Array.isArray(fee.installments.parts)) setInstallments(fee.installments.parts)
      }
    } catch {}
    try {
      // Load application for student name context
      const appUrl = API
        ? `${API}/v1/onboarding/applications/${appId}`
        : `/api/local/staff/applications/${appId}`
      const appRes = await fetch(appUrl)
      if (appRes.ok) {
        const app = await appRes.json()
        const s = app?.data?.student || {}
        setStudentName(`${s.firstName || ''} ${s.lastName || ''}`.trim())
      }
      setAppLoaded(true)
    } catch {}
    setLoading(false)
  }

  React.useEffect(() => { setMounted(true) }, [])
  React.useEffect(() => { load() }, [appId])

  const total = items.reduce((s, it) => s + Number(it.amount || 0), 0)

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }
  const addItem = () => setItems(prev => [...prev, { label: '', amount: 0 }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateInstallment = (idx: number, patch: Partial<Installment>) => {
    setInstallments(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }
  const addInstallment = () => setInstallments(prev => [...prev, { label: '', dueDate: '', amount: 0 }])
  const removeInstallment = (idx: number) => setInstallments(prev => prev.filter((_, i) => i !== idx))

  const generateWithGap = (startDate: string, count: number, gapMonths: number) => {
    // startDate format: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || count <= 0 || gapMonths < 0) return
    const [y, m, d] = startDate.split('-').map(Number)
    const base = new Date(y, m - 1, d)
    const eq = Math.floor((total / count) * 100) / 100
    const parts: Installment[] = []
    let accrued = 0
    for (let i = 0; i < count; i++) {
      const due = new Date(base)
      due.setMonth(base.getMonth() + i * Math.max(1, gapMonths))
      const amt = i === count - 1 ? Math.max(0, Number((total - accrued).toFixed(2))) : eq
      accrued += amt
      parts.push({ label: `Inst ${i + 1}`, dueDate: due.toISOString().slice(0, 10), amount: amt })
    }
    setInstallments(parts)
  }

  const onSave = async () => {
    try {
      setSaving(true)
      const body = JSON.stringify({ items, total, installments })
      const url = API
        ? `${API}/v1/onboarding/staff/applications/${appId}/fees`
        : `/api/local/staff/applications/${appId}/fees`
      const res = API
        ? await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })
        : await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body })
      if (!res.ok) throw new Error('save_failed')
      alert('Saved fees and installments')
    } catch (e) {
      alert('Save failed')
    } finally { setSaving(false) }
  }

  if (!mounted) {
    return (
      <div className="container">
        <div className="card">Loading…</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="hero-card" style={{ marginBottom: 16 }}>
        <h1 className="title">{role.toUpperCase()} — Fees Editor</h1>
        <p className="subtitle">Application: {appId}{studentName ? ` • ${studentName}` : ''}</p>
      </div>
      <div className="card">
        {loading ? <div>Loading…</div> : (
          <div style={{ display: 'grid', gap: 16 }}>
            <section>
              <h3>Fee Items</h3>
              <table className="table">
                <thead>
                  <tr><th>Label</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td><input className="input" value={it.label} onChange={e=>updateItem(idx,{label:e.target.value})} placeholder="Tuition" /></td>
                      <td><input type="number" className="input" value={String(it.amount)} onChange={e=>updateItem(idx,{amount:Number(e.target.value)})} /></td>
                      <td><button type="button" className="button" onClick={()=>removeItem(idx)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="button" onClick={addItem}>Add Item</button>
                <div style={{ marginLeft: 'auto', fontWeight: 600 }}>Total: ₹{Number(total||0).toLocaleString('en-IN')}</div>
              </div>
            </section>

            <section>
              <h3>Installments</h3>
              <div className="card" style={{ padding: 12, background: '#f8fafc' }}>
                <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
                  <span className="label">Installments</span>
                  <input type="number" min={1} className="input" value={genCount} onChange={e=>setGenCount(Math.max(1, Number(e.target.value)||1))} style={{ width: 100 }} />
                  <span className="label">Next installment after (months)</span>
                  <input type="number" min={1} className="input" value={genGapMonths} onChange={e=>setGenGapMonths(Math.max(1, Number(e.target.value)||1))} style={{ width: 100 }} />
                  <span className="label">Start from</span>
                  <input type="date" className="input" value={genStartDate} onChange={e=>setGenStartDate(e.target.value)} />
                  <button className="button" type="button" onClick={()=> generateWithGap(genStartDate || new Date().toISOString().slice(0,10), genCount, genGapMonths)}>
                    Split equally into {genCount}
                  </button>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Label</th><th>Due Date</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {installments.map((ins, idx) => (
                    <tr key={idx}>
                      <td><input className="input" value={ins.label||''} onChange={e=>updateInstallment(idx,{label:e.target.value})} placeholder={`Inst ${idx+1}`} /></td>
                      <td><input type="date" className="input" value={ins.dueDate} onChange={e=>updateInstallment(idx,{dueDate:e.target.value})} /></td>
                      <td><input type="number" className="input" value={String(ins.amount)} onChange={e=>updateInstallment(idx,{amount:Number(e.target.value)})} /></td>
                      <td><button type="button" className="button" onClick={()=>removeInstallment(idx)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="button" onClick={addInstallment}>Add Installment</button>
            </section>

            <div style={{ display: 'flex', gap: 8, justifyContent:'flex-end' }}>
              <button disabled={saving || loading || !appLoaded} className="button" onClick={onSave}>{saving? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
