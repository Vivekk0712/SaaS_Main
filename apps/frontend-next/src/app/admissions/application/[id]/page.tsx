"use client"
import React from 'react'
import { useParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type FeeItem = { label: string; amount: number }

export default function AdmissionsApplicationDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const [data, setData] = React.useState<any | null>(null)
  const [items, setItems] = React.useState<FeeItem[]>([])
  const [instCount, setInstCount] = React.useState<number>(1)
  const [instParts, setInstParts] = React.useState<number[]>([])
  const [instDue, setInstDue] = React.useState<string[]>([])
  const [gapMonths, setGapMonths] = React.useState<number>(6)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<any | null>(null)
  const approved = data?.status === 'admissions_confirmed'

  const load = async () => {
    try {
      setLoading(true)
      // Fast: load from local aggregator first
      let app: any = null
      try {
        const rl = await fetch(`/api/local/staff/applications/${id}`)
        const j = await rl.json()
        app = { ...j.application, fee: j.fee }
      } catch {}
      if (app) {
        setData(app)
        setItems(app?.fee?.items || [])
        setDraft(app?.data ? JSON.parse(JSON.stringify(app.data)) : {})
        const ins: any = app?.fee?.installments
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
        setLoading(false)
      }
      // Optional: try remote in background to refresh
      try {
        const r = await fetch(`${API}/v1/onboarding/applications/${id}`)
        if (r.ok) {
          const remoteApp = await r.json()
          // keep existing fee items loaded locally for speed
          setData((prev: any) => ({ ...(remoteApp||prev), fee: prev?.fee }))
        }
      } catch {}
    } catch { setData(null); setItems([]); setLoading(false) }
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
    const today = new Date()
    const dates: string[] = []
    for (let i=0;i<c;i++) { const d = new Date(today); d.setMonth(d.getMonth() + (i*gapMonths)); dates.push(d.toISOString().slice(0,10)) }
    setInstDue(dates)
  }, [])

  React.useEffect(() => {
    // If no installments loaded yet or count changed, recompute equal split
    if (instParts.length === 0 || instParts.length !== instCount) {
      recomputeInstallments(instCount, total)
    }
  }, [instCount, total])
  React.useEffect(() => {
    // Update due dates when gap changes
    const today = new Date()
    const dates: string[] = []
    for (let i=0;i<instCount;i++) { const d = new Date(today); d.setMonth(d.getMonth() + (i*gapMonths)); dates.push(d.toISOString().slice(0,10)) }
    setInstDue(dates)
  }, [gapMonths])

  const setField = (path: string, value: any) => {
    setDraft((d: any) => {
      const next = { ...(d || {}) }
      const keys = path.split('.')
      let cur: any = next
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        cur[k] = cur[k] || {}
        cur = cur[k]
      }
      cur[keys[keys.length - 1]] = value
      return next
    })
  }

  const saveEdits = async () => {
    if (!draft) return
    try {
      setSaving(true)
      try {
        const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-role': 'admissions', 'x-password': '12345' }, body: JSON.stringify({ application: draft }) })
        if (!r.ok) throw new Error('remote_err')
      } catch {
        const rl = await fetch(`/api/local/staff/applications/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ application: draft }) })
        if (!rl.ok) throw new Error('local_err')
      }
      setEditing(false)
      await load()
    } finally { setSaving(false) }
  }

  const confirm = async () => {
    try {
      setSaving(true)
      try {
        const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}/confirm`, { method: 'POST', headers: { 'x-role': 'admissions', 'x-password': '12345' } })
        if (!r.ok) throw new Error('remote_err')
      } catch {
        await fetch(`/api/local/staff/applications/${id}/confirm`, { method: 'POST' })
      }
      await load()
    } finally { setSaving(false) }
  }

  const saveFees = async () => {
    try {
      setSaving(true)
      try {
        const r = await fetch(`${API}/v1/onboarding/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-role': 'admissions', 'x-password': '12345' }, body: JSON.stringify({ items, total, installments: instParts.map((a,i)=>({ label: `Installment ${i+1}`, amount: a, dueDate: instDue[i]||null })) }) })
        if (!r.ok) throw new Error('remote_err')
      } catch {
        await fetch(`/api/local/staff/applications/${id}/fees`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items, total, installments: { count: instCount, parts: instParts.map((a,i)=>({ label: `Installment ${i+1}`, amount: a, dueDate: instDue[i]||null })) } }) })
      }
      alert('Fee structure saved and shared with Accounts & Principal.')
      router.push('/admissions/dashboard')
    } finally { setSaving(false) }
  }

  const confirmFees = async () => {
    try { setSaving(true); await fetch(`/api/local/staff/applications/${id}/fees/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role: 'admissions' }) }) }
    finally { setSaving(false) }
  }

  const markPaid = async () => {
    try { setSaving(true); await fetch(`/api/local/staff/applications/${id}/fees/pay`, { method: 'POST' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 980 }}>
        {loading ? <p className="subtitle">Loading…</p> : !data ? <p>Not found</p> : (
          <>
            <h1 className="title">Application Review</h1>
            <div className="actions" style={{ display:'flex', gap:8, margin:'8px 0 16px 0' }}>
              {!editing ? (
                <button className="btn" type="button" onClick={()=> setEditing(true)}>Edit Application</button>
              ) : (
                <>
                  <button className="btn" type="button" disabled={saving} onClick={saveEdits}>{saving? 'Saving…' : 'Save Changes'}</button>
                  <button className="btn-ghost" type="button" onClick={()=> { setEditing(false); setDraft(data?.data ? JSON.parse(JSON.stringify(data.data)) : {}) }}>Cancel</button>
                </>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 110px', gap:16 }}>
              <div>
                <div className="paper" style={{ position:'relative', boxShadow:'none' }}>
                  <div className="body">
                    <h3>1. Admission Details</h3>
                    <div className="grid">
                      <div className="field"><span className="label">Admission No.</span>{editing ? <input className="input" value={draft?.admission?.number||''} onChange={e=>setField('admission.number', e.target.value)} /> : <div>{data?.data?.admission?.number||'-'}</div>}</div>
                      <div className="field"><span className="label">Date</span>{editing ? <input type="date" className="input" value={draft?.admission?.date||''} onChange={e=>setField('admission.date', e.target.value)} /> : <div>{data?.data?.admission?.date||'-'}</div>}</div>
                      <div className="field"><span className="label">Academic Year</span>{editing ? <input className="input" value={draft?.admission?.year||''} onChange={e=>setField('admission.year', e.target.value)} /> : <div>{data?.data?.admission?.year||'-'}</div>}</div>
                      <div className="field"><span className="label">Grade Applied</span>{editing ? (
                        <select className="select" value={draft?.admission?.grade||''} onChange={e=>setField('admission.grade', e.target.value)}>
                          <option value="">Select</option>
                          {['Nursery','LKG','UKG',...Array.from({length:12},(_,i)=>String(i+1))].map(g => <option key={g}>{g}</option>)}
                        </select>
                      ) : <div>{data?.data?.admission?.grade||'-'}</div>}
                      </div>
                      <div className="field"><span className="label">Section</span>{editing ? <input className="input" value={draft?.admission?.section||''} onChange={e=>setField('admission.section', e.target.value)} /> : <div>{data?.data?.admission?.section||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>2. Student Personal Information</h3>
                    <div className="grid">
                      <div className="field"><span className="label">First Name</span>{editing ? <input className="input" value={draft?.student?.firstName||''} onChange={e=>setField('student.firstName', e.target.value)} /> : <div>{data?.data?.student?.firstName||'-'}</div>}</div>
                      <div className="field"><span className="label">Last Name</span>{editing ? <input className="input" value={draft?.student?.lastName||''} onChange={e=>setField('student.lastName', e.target.value)} /> : <div>{data?.data?.student?.lastName||'-'}</div>}</div>
                      <div className="field"><span className="label">Date of Birth</span>{editing ? <input type="date" className="input" value={draft?.student?.dob||''} onChange={e=>setField('student.dob', e.target.value)} /> : <div>{data?.data?.student?.dob||'-'}</div>}</div>
                      <div className="field"><span className="label">Gender</span>{editing ? (
                        <select className="select" value={draft?.student?.gender||''} onChange={e=>setField('student.gender', e.target.value)}>
                          <option value="">Select</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      ) : <div>{data?.data?.student?.gender||'-'}</div>}
                      </div>
                      <div className="field"><span className="label">Nationality</span>{editing ? <input className="input" value={draft?.student?.nationality||''} onChange={e=>setField('student.nationality', e.target.value)} /> : <div>{data?.data?.student?.nationality||'-'}</div>}</div>
                      <div className="field"><span className="label">Religion</span>{editing ? <input className="input" value={draft?.student?.religion||''} onChange={e=>setField('student.religion', e.target.value)} /> : <div>{data?.data?.student?.religion||'-'}</div>}</div>
                      <div className="field"><span className="label">Languages</span>{editing ? <input className="input" value={draft?.student?.languages||''} onChange={e=>setField('student.languages', e.target.value)} /> : <div>{data?.data?.student?.languages||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>3. Address Details</h3>
                    <div className="grid">
                      <div className="field"><span className="label">Permanent Address</span>{editing ? <textarea className="textarea" value={draft?.address?.permanent||''} onChange={e=>setField('address.permanent', e.target.value)} /> : <div>{data?.data?.address?.permanent||'-'}</div>}</div>
                      <div className="field"><span className="label">Correspondence Address</span>{editing ? <textarea className="textarea" value={draft?.address?.correspondence||''} onChange={e=>setField('address.correspondence', e.target.value)} /> : <div>{data?.data?.address?.correspondence||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>4. Parent/Guardian Information</h3>
                    <div className="grid">
                      <div className="field"><span className="label">Father/Guardian</span>{editing ? <input className="input" value={draft?.guardians?.father||''} onChange={e=>setField('guardians.father', e.target.value)} /> : <div>{data?.data?.guardians?.father||'-'}</div>}</div>
                      <div className="field"><span className="label">Occupation</span>{editing ? <input className="input" value={draft?.guardians?.fatherOccupation||''} onChange={e=>setField('guardians.fatherOccupation', e.target.value)} /> : <div>{data?.data?.guardians?.fatherOccupation||'-'}</div>}</div>
                      <div className="field"><span className="label">Phone</span>{editing ? <input className="input" value={draft?.guardians?.fatherPhone||''} onChange={e=>setField('guardians.fatherPhone', e.target.value)} /> : <div>{data?.data?.guardians?.fatherPhone||'-'}</div>}</div>
                      <div className="field"><span className="label">Email</span>{editing ? <input className="input" value={draft?.guardians?.fatherEmail||''} onChange={e=>setField('guardians.fatherEmail', e.target.value)} /> : <div>{data?.data?.guardians?.fatherEmail||'-'}</div>}</div>
                      <div className="field"><span className="label">Mother/Guardian</span>{editing ? <input className="input" value={draft?.guardians?.mother||''} onChange={e=>setField('guardians.mother', e.target.value)} /> : <div>{data?.data?.guardians?.mother||'-'}</div>}</div>
                      <div className="field"><span className="label">Occupation</span>{editing ? <input className="input" value={draft?.guardians?.motherOccupation||''} onChange={e=>setField('guardians.motherOccupation', e.target.value)} /> : <div>{data?.data?.guardians?.motherOccupation||'-'}</div>}</div>
                      <div className="field"><span className="label">Phone</span>{editing ? <input className="input" value={draft?.guardians?.motherPhone||''} onChange={e=>setField('guardians.motherPhone', e.target.value)} /> : <div>{data?.data?.guardians?.motherPhone||'-'}</div>}</div>
                      <div className="field"><span className="label">Email</span>{editing ? <input className="input" value={draft?.guardians?.motherEmail||''} onChange={e=>setField('guardians.motherEmail', e.target.value)} /> : <div>{data?.data?.guardians?.motherEmail||'-'}</div>}</div>
                      <div className="field"><span className="label">Guardian</span>{editing ? <input className="input" value={draft?.guardians?.guardian||''} onChange={e=>setField('guardians.guardian', e.target.value)} /> : <div>{data?.data?.guardians?.guardian||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>5. Previous School Details</h3>
                    <div className="grid">
                      <div className="field"><span className="label">School Name</span>{editing ? <input className="input" value={draft?.previousSchool?.name||''} onChange={e=>setField('previousSchool.name', e.target.value)} /> : <div>{data?.data?.previousSchool?.name||'-'}</div>}</div>
                      <div className="field"><span className="label">Board</span>{editing ? <input className="input" value={draft?.previousSchool?.board||''} onChange={e=>setField('previousSchool.board', e.target.value)} /> : <div>{data?.data?.previousSchool?.board||'-'}</div>}</div>
                      <div className="field"><span className="label">Last Grade</span>{editing ? <input className="input" value={draft?.previousSchool?.lastGrade||''} onChange={e=>setField('previousSchool.lastGrade', e.target.value)} /> : <div>{data?.data?.previousSchool?.lastGrade||'-'}</div>}</div>
                      <div className="field"><span className="label">Year of Completion</span>{editing ? <input className="input" value={draft?.previousSchool?.yearOfCompletion||''} onChange={e=>setField('previousSchool.yearOfCompletion', e.target.value)} /> : <div>{data?.data?.previousSchool?.yearOfCompletion||'-'}</div>}</div>
                      <div className="field"><span className="label">Reason for Transfer</span>{editing ? <input className="input" value={draft?.previousSchool?.reason||''} onChange={e=>setField('previousSchool.reason', e.target.value)} /> : <div>{data?.data?.previousSchool?.reason||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>6. Health and Emergency Information</h3>
                    <div className="grid">
                      <div className="field"><span className="label">Blood Group</span>{editing ? <input className="input" value={draft?.health?.bloodGroup||''} onChange={e=>setField('health.bloodGroup', e.target.value)} /> : <div>{data?.data?.health?.bloodGroup||'-'}</div>}</div>
                      <div className="field"><span className="label">Allergies</span>{editing ? <input className="input" value={draft?.health?.allergies||''} onChange={e=>setField('health.allergies', e.target.value)} /> : <div>{data?.data?.health?.allergies||'-'}</div>}</div>
                      <div className="field"><span className="label">Conditions</span>{editing ? <input className="input" value={draft?.health?.conditions||''} onChange={e=>setField('health.conditions', e.target.value)} /> : <div>{data?.data?.health?.conditions||'-'}</div>}</div>
                      <div className="field"><span className="label">Emergency Contact Name</span>{editing ? <input className="input" value={draft?.health?.emergencyName||''} onChange={e=>setField('health.emergencyName', e.target.value)} /> : <div>{data?.data?.health?.emergencyName||'-'}</div>}</div>
                      <div className="field"><span className="label">Emergency Contact Phone</span>{editing ? <input className="input" value={draft?.health?.emergencyPhone||''} onChange={e=>setField('health.emergencyPhone', e.target.value)} /> : <div>{data?.data?.health?.emergencyPhone||'-'}</div>}</div>
                      <div className="field"><span className="label">Relationship</span>{editing ? <input className="input" value={draft?.health?.relation||''} onChange={e=>setField('health.relation', e.target.value)} /> : <div>{data?.data?.health?.relation||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>7. Transport & Fee Information</h3>
                    <div className="grid">
                      <div className="field"><span className="label">Mode of Transport</span>{editing ? (
                        <select className="select" value={draft?.transport?.mode||''} onChange={e=>setField('transport.mode', e.target.value)}>
                          <option value="">Select</option>
                          <option>School Bus</option>
                          <option>Private</option>
                          <option>Walk</option>
                        </select>
                      ) : <div>{data?.data?.transport?.mode||'-'}</div>}
                      </div>
                      <div className="field"><span className="label">Bus Route/Stop</span>{editing ? <input className="input" value={draft?.transport?.route||''} onChange={e=>setField('transport.route', e.target.value)} /> : <div>{data?.data?.transport?.route||'-'}</div>}</div>
                    </div>

                    <h3 style={{ marginTop:18 }}>8. Documents Submitted</h3>
                    {editing ? (
                      <div className="grid">
                        <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="checkbox" checked={!!draft?.documents?.tc} onChange={e=>setField('documents.tc', e.target.checked)} /> Transfer Certificate (TC)
                        </label>
                        <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="checkbox" checked={!!draft?.documents?.reportCard} onChange={e=>setField('documents.reportCard', e.target.checked)} /> Report Card
                        </label>
                        <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="checkbox" checked={!!draft?.documents?.aadhaar} onChange={e=>setField('documents.aadhaar', e.target.checked)} /> Aadhaar Copy
                        </label>
                        <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="checkbox" checked={!!draft?.documents?.photos} onChange={e=>setField('documents.photos', e.target.checked)} /> Passport-size Photos
                        </label>
                        <label className="field"><span className="label">Other</span>
                          <input className="input" value={draft?.documents?.others||''} onChange={e=>setField('documents.others', e.target.value)} />
                        </label>
                      </div>
                    ) : (
                      <ul>
                        {data?.data?.documents?.tc ? <li>Transfer Certificate ✔</li> : null}
                        {data?.data?.documents?.reportCard ? <li>Report Card ✔</li> : null}
                        {data?.data?.documents?.aadhaar ? <li>Aadhaar Copy ✔</li> : null}
                        {data?.data?.documents?.photos ? <li>Passport Photos ✔</li> : null}
                        {data?.data?.documents?.others ? <li>Other: {data?.data?.documents?.others}</li> : null}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                {data?.data?.photoDataUrl ? <img src={data.data.photoDataUrl} alt="Passport" style={{ width:110, height:130, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb' }} /> : null}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <h2 className="title" style={{ fontSize: 20 }}>Fee Structure • {data?.data?.student?.firstName} {data?.data?.student?.lastName} • Grade {data?.data?.admission?.grade}</h2>
              {!approved ? <p className="note">Approve the application to enable fee editing.</p> : null}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th align="left">Particulars</th><th align="right">Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                      <td><input className="input" value={it.label} onChange={e=>upd(i,{label:e.target.value})} placeholder="Tuition / Transport / Misc" disabled={!approved} /></td>
                      <td align="right"><input className="input" value={it.amount} onChange={e=>upd(i,{amount:Number(e.target.value||0)})} disabled={!approved} /></td>
                      <td><button className="btn-ghost" onClick={() => rmRow(i)} type="button" disabled={!approved}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="actions" style={{ justifyContent:'space-between' }}>
                <button className="btn-ghost" type="button" onClick={addRow} disabled={!approved}>Add Row</button>
                <div style={{ fontWeight:700 }}>Total: {total.toLocaleString('en-IN', { style:'currency', currency:'INR' })}</div>
              </div>
              <div className="actions">
                {!approved && <button className="btn" type="button" disabled={saving} onClick={confirm}>{saving? 'Saving…' : 'Approve Application'}</button>}
                <button className="btn" type="button" disabled={saving || !approved} onClick={saveFees}>{saving? 'Saving…' : 'Save Fee'}</button>
                <button className="btn" type="button" disabled={saving || !approved} onClick={confirmFees}>Confirm Fees & Notify</button>
              </div>

              <div className="actions" style={{ justifyContent:'space-between' }}>
                <div className="field" style={{ maxWidth: 280 }}>
                  <span className="label">Installments</span>
                  <input className="input" type="number" min={1} value={instCount} onChange={e=>setInstCount(Number(e.target.value||1))} disabled={!approved} />
                </div>
                <div className="field" style={{ maxWidth: 280 }}>
                  <span className="label">Next installment after (months)</span>
                  <input className="input" type="number" min={1} value={gapMonths} onChange={e=>{ const v = Number(e.target.value||1); setGapMonths(v); recomputeInstallments(instCount, total) }} disabled={!approved} />
                </div>
                {instParts.length>1 && (
                  <div className="badge info">Split equally into {instParts.length}</div>
                )}
              </div>
              {instParts.length>0 && (
                <table className="table" style={{ marginTop: 8 }}>
                  <thead><tr><th align="left">Installment</th><th align="right">Amount</th><th align="left">Due Date</th></tr></thead>
                  <tbody>
                    {instParts.map((a,i)=> (
                      <tr key={i}>
                        <td>Installment {i+1}</td>
                        <td align="right">{a.toLocaleString('en-IN',{ style:'currency', currency:'INR'})}</td>
                        <td><input type="date" className="input" value={instDue[i]||''} onChange={e=>setInstDue(prev=> prev.map((v,idx)=> idx===i? e.target.value : v))} disabled={!approved} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
