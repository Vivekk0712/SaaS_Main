"use client"
import React from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type Application = { id?: string; _id?: string; parentPhone: string; data: any; status: string; createdAt?: string }

export default function StaffAdmissionsList() {
  const [items, setItems] = React.useState<Application[]>([])
  const [status, setStatus] = React.useState('submitted')

  const load = async () => {
    try {
      const r = API
        ? await fetch(`${API}/v1/onboarding/staff/applications?status=${encodeURIComponent(status)}`, { headers: { 'x-role': 'admissions', 'x-password': '12345' } })
        : await fetch(`/api/local/staff/applications?status=${encodeURIComponent(status)}`)
      const j = await r.json()
      setItems(j.items || [])
    } catch { setItems([]) }
  }

  React.useEffect(() => { load() }, [status])

  return (
    <div className="container">
      <div className="hero-card" style={{ marginBottom: 16 }}>
        <h1 className="title">Admissions — Applications</h1>
        <p className="subtitle">View and edit submitted applications.</p>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <label className="label">Status</label>
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="submitted">Submitted</option>
            <option value="admissions_confirmed">Admissions Confirmed</option>
            <option value="fees_set">Fees Set</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade</th>
              <th>Parent Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, i) => {
              const id = (a as any)._id?.$oid || (typeof (a as any)._id === 'string' ? (a as any)._id : (a as any)._id?.toString?.()) || (a as any).id
              const s = a.data?.student || {}
              const name = `${s.firstName || ''} ${s.lastName || ''}`.trim()
              return (
                <tr key={id || i}>
                  <td>{name || '-'}</td>
                  <td>{a.data?.admission?.grade || '-'}</td>
                  <td>{a.parentPhone}</td>
                  <td>{a.status}</td>
                  <td>
                    {id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link className="button" href={`/staff/admissions/${id}`}>View / Edit</Link>
                        <Link className="button" href={`/staff/admissions/${id}/fees`}>Edit Fees</Link>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
