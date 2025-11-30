"use client"
import React from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type Fee = { appId: string; items: Array<{ label: string; amount: number }>; total: number; installments?: Array<{ label?: string; dueDate: string; amount: number }>; updatedAt: string; app?: any }

export default function AccountantFeesList() {
  const [items, setItems] = React.useState<Fee[]>([])

  const load = async () => {
    try {
      const r = API
        ? await fetch(`${API}/v1/onboarding/staff/fees`, { headers: { 'x-role': 'accountant', 'x-password': '12345' } })
        : await fetch('/api/local/staff/fees')
      const j = await r.json()
      setItems(j.items || [])
    } catch { setItems([]) }
  }

  React.useEffect(() => { load() }, [])

  return (
    <div className="container">
      <div className="hero-card" style={{ marginBottom: 16 }}>
        <h1 className="title">Fees — Installments</h1>
        <p className="subtitle">Fees and installment plans visible to Accountant and Principal.</p>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Total</th>
              <th>Installments</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f, i) => {
              const s = f.app?.data?.student || {}
              const name = `${s.firstName || ''} ${s.lastName || ''}`.trim()
              const id = (f.app as any)?._id?.$oid || (f.app as any)?._id?.toString?.() || (f.app as any)?.id
              return (
                <tr key={i}>
                  <td>{name || '-'}</td>
                  <td>₹{Number(f.total||0).toLocaleString('en-IN')}</td>
                  <td>
                    {(() => {
                      const parts = Array.isArray((f as any).installments)
                        ? (f as any).installments
                        : Array.isArray((f as any).installments?.parts)
                          ? (f as any).installments.parts
                          : []
                      return parts.length > 0
                        ? parts.map((ins: any, idx: number) => (
                            <div key={idx}>{ins.label || `Inst ${idx+1}`} — {ins.dueDate} — ₹{Number(ins.amount||0).toLocaleString('en-IN')}</div>
                          ))
                        : <span>—</span>
                    })()}
                  </td>
                  <td>{new Date(f.updatedAt).toLocaleString()}</td>
                  <td>{id ? <Link className="button" href={`/staff/accountant/fees/${id}`}>Edit Fees</Link> : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
