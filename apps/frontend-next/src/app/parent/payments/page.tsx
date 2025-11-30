"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'

type Part = { label?: string; amount: number; dueDate?: string }

export default function ParentPaymentsPage() {
  const pathname = usePathname()
  const [loading, setLoading] = React.useState(true)
  const firstLoadRef = React.useRef(true)
  const [appId, setAppId] = React.useState<string>('')
  const [items, setItems] = React.useState<Array<{ label: string; amount: number }>>([])
  const [parts, setParts] = React.useState<Part[]>([])
  const [paid, setPaid] = React.useState<boolean[]>([])
  const [nextIndex, setNextIndex] = React.useState<number>(-1)
  const [updatedAt, setUpdatedAt] = React.useState<string>('')
  const [message, setMessage] = React.useState<string>('')
  const [adhoc, setAdhoc] = React.useState<Array<{ id:string; title:string; total:number; createdAt:string; status?:string }>>([])
  const [showPaidFilter, setShowPaidFilter] = React.useState(false)
  const [paidWhen, setPaidWhen] = React.useState<'all' | 'today' | 'week'>('all')
  const [showTransFilter, setShowTransFilter] = React.useState(false)
  const [transFilter, setTransFilter] = React.useState<'all' | 'paid' | 'pending' | 'paid_today' | 'paid_week'>('all')

  const phone = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('parent') || '{}').phone || '' } catch { return '' }
  }, [])

  const load = async (background = false) => {
    if (!phone) return
    try {
      if (!background && firstLoadRef.current) setLoading(true)
      const r = await fetch(`/api/local/parent/fees?phone=${encodeURIComponent(phone)}`)
      const j = await r.json()
      setAppId(j.appId || '')
      setItems(j.items || [])
      setParts(Array.isArray(j.parts) ? j.parts : [])
      setPaid(Array.isArray(j.paidParts) ? j.paidParts : [])
      setNextIndex(typeof j.nextIndex === 'number' ? j.nextIndex : -1)
      setUpdatedAt(j.updatedAt || '')
      // Load ad-hoc bills
      try { const ar = await fetch(`/api/local/parent/fees/adhoc?phone=${encodeURIComponent(phone)}`); const aj = await ar.json(); setAdhoc(Array.isArray(aj.items) ? aj.items : []) } catch { setAdhoc([]) }
    } catch { setItems([]); setParts([]); setPaid([]); setNextIndex(-1) }
    finally { if (firstLoadRef.current) { setLoading(false); firstLoadRef.current = false } }
  }

  React.useEffect(() => { load(true); const id = setInterval(() => load(true), 4000); return () => clearInterval(id) }, [phone])

  const total = items.reduce((s,it)=> s + Number(it.amount||0), 0)
  const totalDue = parts.reduce((s, p, idx) => s + (!paid[idx] ? Number(p.amount||0) : 0), 0)
  const totalPaid = total - totalDue

  // Razorpay integration
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const payWithRazorpay = async (amount: number, description: string, invoiceId: string, onSuccess: () => void) => {
    const res = await initializeRazorpay()
    if (!res) {
      setMessage('Razorpay SDK failed to load')
      setTimeout(() => setMessage(''), 2500)
      return
    }

    try {
      // Create order via our API
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount,
          currency: 'INR',
          invoiceId: invoiceId,
          idempotencyKey: `KEY_${Date.now()}_${invoiceId}`
        })
      })
      
      if (!orderRes.ok) {
        throw new Error('Failed to create order')
      }
      
      const order = await orderRes.json()
      
      if (!order.success) {
        throw new Error(order.message || 'Failed to create order')
      }
      
      // Initialize Razorpay checkout
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'School SAS',
        description: description,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })
            
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json()
              if (verifyData.success) {
                onSuccess()
                setMessage('Payment successful!')
                setTimeout(() => setMessage(''), 2500)
              } else {
                setMessage('Payment verification failed')
                setTimeout(() => setMessage(''), 2500)
              }
            } else {
              setMessage('Payment verification failed')
              setTimeout(() => setMessage(''), 2500)
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            setMessage('Payment verification failed')
            setTimeout(() => setMessage(''), 2500)
          }
        },
        prefill: {
          contact: phone,
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            setMessage('Payment cancelled')
            setTimeout(() => setMessage(''), 2500)
          }
        }
      }
      
      const paymentObject = new (window as any).Razorpay(options)
      paymentObject.open()
    } catch (error) {
      console.error('Payment error:', error)
      setMessage('Payment failed. Please try again.')
      setTimeout(() => setMessage(''), 2500)
    }
  }

  const pay = async (idx: number) => {
    if (!appId) return
    const installment = parts[idx]
    if (!installment) return
    
    const amount = Number(installment.amount || 0)
    const description = `${installment.label || `Installment ${idx + 1}`}`
    const invoiceId = `${appId}_INST_${idx}`
    
    await payWithRazorpay(amount, description, invoiceId, async () => {
      // Mark as paid in local system
      try {
        await fetch('/api/local/parent/fees/pay', { 
          method: 'POST', 
          headers: { 'content-type': 'application/json' }, 
          body: JSON.stringify({ appId, index: idx }) 
        })
        await load(true)
      } catch (error) {
        console.error('Failed to update payment status:', error)
      }
    })
  }

  const payAdhoc = async (id: string) => {
    const bill = adhoc.find(b => b.id === id)
    if (!bill) return
    
    const amount = Number(bill.total || 0)
    const description = bill.title || 'Additional Fee'
    const invoiceId = `ADHOC_${id}`
    
    await payWithRazorpay(amount, description, invoiceId, async () => {
      // Mark adhoc bill as paid
      try {
        await fetch('/api/local/parent/fees/adhoc/pay', { 
          method:'POST', 
          headers:{'content-type':'application/json'}, 
          body: JSON.stringify({ billId: id }) 
        })
        await load(true)
      } catch (error) {
        console.error('Failed to update adhoc payment status:', error)
      }
    })
  }

  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
  const byDue = [...parts.map((p, i) => ({ p, i }))].sort((a,b) => {
    const ad = a.p.dueDate ? new Date(a.p.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bd = b.p.dueDate ? new Date(b.p.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const ap = paid[a.i] ? 1 : 0
    const bp = paid[b.i] ? 1 : 0
    if (ap !== bp) return ap - bp // unpaid first
    return ad - bd // earliest due first
  })

  const paidParts = parts
    .map((p, idx) => ({ p, idx }))
    .filter(({ idx }) => paid[idx])

  const filteredPaidParts = React.useMemo(() => {
    if (!paidParts.length) return []
    if (paidWhen === 'all') return paidParts
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)
    const inToday = (d: Date) => d.getTime() === today.getTime()
    const inWeek = (d: Date) => d.getTime() >= startOfWeek.getTime() && d.getTime() <= today.getTime()
    return paidParts.filter(({ p }) => {
      const base = p.dueDate || updatedAt
      if (!base) return paidWhen === 'all'
      const d = new Date(base)
      if (Number.isNaN(d.getTime())) return false
      if (paidWhen === 'today') return inToday(d)
      if (paidWhen === 'week') return inWeek(d)
      return true
    })
  }, [paidParts, paidWhen, updatedAt])

  const filteredAdhoc = React.useMemo(() => {
    if (!adhoc.length) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)
    const inToday = (d: Date) => d.getTime() === today.getTime()
    const inWeek = (d: Date) => d.getTime() >= startOfWeek.getTime() && d.getTime() <= today.getTime()
    return adhoc.filter(bill => {
      const status = (bill.status || '').toLowerCase()
      const d = bill.createdAt ? new Date(bill.createdAt) : null
      const isPaid = status === 'paid'
      const isPending = !status || status === 'pending'
      const matchStatus =
        transFilter === 'all' ||
        (transFilter === 'paid' && isPaid) ||
        (transFilter === 'pending' && isPending) ||
        (transFilter === 'paid_today' && isPaid) ||
        (transFilter === 'paid_week' && isPaid)
      if (!matchStatus) return false
      if (!d || Number.isNaN(d.getTime())) return transFilter === 'all' || transFilter === 'paid' || transFilter === 'pending'
      if (transFilter === 'paid_today') return inToday(d)
      if (transFilter === 'paid_week') return inWeek(d)
      return true
    })
  }, [adhoc, transFilter])

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/parent/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/parent/progress', label: 'Progress', icon: '📊' },
    { href: '/parent/attendance', label: 'Attendance', icon: '✅' },
    { href: '/parent/diary', label: 'Digital Diary', icon: '📔' },
    { href: '/parent/calendar', label: 'Calendar', icon: '📅' },
    { href: '/parent/circulars', label: 'Circulars', icon: '📣' },
    { href: '/parent/payments', label: 'Payments', icon: '💳' }
  ]

  return (
    <div className="parent-shell">
      <div className="topbar topbar-parent">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>PARENT</strong>
          </div>
          <nav className="tabs" aria-label="Parent navigation tabs">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                className="tab"
                style={{ pointerEvents: 'none', opacity: 0.4 }}
                aria-hidden="true"
              >
                &nbsp;
              </button>
            ))}
          </nav>
          <div />
        </div>
      </div>
      <div className="dash-wrap parent-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-parent" aria-label="Parent quick navigation">
            {navLinks.map(link => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`side-nav-link ${active ? 'side-nav-link-active' : ''}`}
                  aria-label={link.label}
                >
                  <span className="side-nav-icon">{link.icon}</span>
                  <span>{link.label.split(' ')[0]}</span>
                </Link>
              )
            })}
          </aside>

          <div className="dash">
            <div
              style={{
                height: 6,
                width: 64,
                borderRadius: 999,
                background: '#3b2c1a',
                marginBottom: 10,
              }}
            />
            <h2 className="title">Payments</h2>
            <p className="subtitle">
              View your fee summary, dues, paid fees, and recent online transactions.
            </p>

      {loading ? (
        <p className="note">Loading…</p>
      ) : (
        <>
          {!appId && (
            <p className="note" style={{ marginBottom: 8 }}>
              No fee schedule available yet. Showing an empty summary until the school
              publishes fees for this account.
            </p>
          )}
          {message && (
            <div className="badge info" role="status" aria-live="polite">
              {message}
            </div>
          )}

          {/* Top: Fee Summary + Due Fee area */}
          <section
            className="card"
            style={{
              padding: 24,
              borderRadius: 16,
              marginTop: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>Fee Summary</div>
              <div className="note">
                Last updated:{' '}
                {updatedAt ? new Date(updatedAt).toLocaleString() : 'Not available'}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2.4fr) minmax(0, 2.0fr)',
                gap: 16,
                alignItems: 'stretch',
              }}
            >
              {/* Left: summary tiles + paid circle (no overlap) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.2fr) auto minmax(0, 1.2fr)',
                  gap: 12,
                  alignItems: 'stretch',
                }}
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  {/* Total Fee */}
                  <div
                    className="card"
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      boxShadow: 'none',
                      border: '1px solid rgba(129,140,248,0.35)',
                      background: 'var(--panel)',
                    }}
                  >
                    <div
                      className="label"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ fontSize: 16 }}>💰</span>
                      <span>Total Fee*</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>
                      {total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </div>
                  </div>

                  {/* Late Fee */}
                  <div
                    className="card"
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      boxShadow: 'none',
                      border: '1px solid rgba(251,191,36,0.4)',
                      background: 'var(--panel)',
                    }}
                  >
                    <div
                      className="label"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ fontSize: 16 }}>🔐</span>
                      <span>Late Fee*</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>₹0</div>
                  </div>
                </div>

                {/* Paid circle in its own column */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      background: '#eff6ff',
                      border: '6px solid #2563eb',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 12px 30px rgba(15,23,42,0.25)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 22,
                        color: '#1d4ed8',
                      }}
                    >
                      {totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        marginTop: 4,
                        color: '#1f2933',
                      }}
                    >
                      Paid Fees*
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  {/* Due Fee */}
                  <div
                    className="card"
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      boxShadow: 'none',
                      border: '1px solid rgba(248,113,113,0.4)',
                      background: 'var(--panel)',
                    }}
                  >
                    <div
                      className="label"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ fontSize: 16 }}>📅</span>
                      <span>Due Fee*</span>
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 18,
                        marginTop: 4,
                        color: totalDue ? '#b91c1c' : 'var(--success)',
                      }}
                    >
                      {totalDue.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </div>
                  </div>

                  {/* Advance Fee */}
                  <div
                    className="card"
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      boxShadow: 'none',
                      border: '1px solid rgba(34,197,94,0.4)',
                      background: 'var(--panel)',
                    }}
                  >
                    <div
                      className="label"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ fontSize: 16 }}>💳</span>
                      <span>Advance Fee*</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>₹0</div>
                  </div>
                </div>
              </div>

              {/* Right: Due Fee visualization / message */}
              <div
                className="card"
                style={{
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {totalDue === 0 ? (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>No dues available.</div>
                    <div className="note">
                      All your scheduled fees are paid for this academic year.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Fees due</div>
                    <div className="note">
                      Please clear outstanding installments before their due dates.
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Unpaid Installments Section */}
          {byDue.filter(({ i }) => !paid[i]).length > 0 && (
            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>
                📋 Pending Installments
              </div>
              <div className="table" style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Installment</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDue
                      .filter(({ i }) => !paid[i])
                      .map(({ p, i }, idx) => {
                        const isNext = i === nextIndex
                        const dueDate = p.dueDate ? new Date(p.dueDate) : null
                        const isOverdue = dueDate && dueDate < startOfToday
                        return (
                          <tr key={i} style={{ background: isNext ? 'rgba(59,130,246,0.05)' : undefined }}>
                            <td>
                              {p.label || `Installment ${i + 1}`}
                              {isNext && <span className="badge info" style={{ marginLeft: 8, fontSize: 10 }}>Next Due</span>}
                            </td>
                            <td>
                              {dueDate ? dueDate.toLocaleDateString() : '-'}
                              {isOverdue && <span style={{ color: '#b91c1c', marginLeft: 6, fontSize: 11 }}>⚠️ Overdue</span>}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {Number(p.amount || 0).toLocaleString('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                              })}
                            </td>
                            <td>
                              <span className={`badge ${isOverdue ? 'error' : 'warning'}`}>
                                {isOverdue ? 'Overdue' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn"
                                style={{ fontSize: 12, padding: '6px 12px' }}
                                onClick={() => pay(i)}
                              >
                                💳 Pay Now
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Ad-hoc Fees Section */}
          {adhoc.length > 0 && (
            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>
                📬 Additional Fees (Ad-hoc)
              </div>
              <p className="note" style={{ marginBottom: 12 }}>
                These are additional fees assigned by the accountant for specific purposes.
              </p>
              <div className="table" style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date Assigned</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adhoc.map((bill) => {
                      const isPaid = (bill.status || '').toLowerCase() === 'paid'
                      return (
                        <tr key={bill.id}>
                          <td style={{ fontWeight: 600 }}>{bill.title}</td>
                          <td>
                            {bill.createdAt
                              ? new Date(bill.createdAt).toLocaleDateString()
                              : '-'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {Number(bill.total || 0).toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </td>
                          <td>
                            <span className={`badge ${isPaid ? 'success' : 'warning'}`}>
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            {!isPaid ? (
                              <button
                                className="btn"
                                style={{ fontSize: 12, padding: '6px 12px' }}
                                onClick={() => payAdhoc(bill.id)}
                              >
                                💳 Pay Now
                              </button>
                            ) : (
                              <span className="note">Paid ✓</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Bottom: Paid Fee & Online Recent Transactions */}
          <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 2.2fr)',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              {/* Paid Fee table */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Paid Fee</div>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', gap:6 }}>
                    <button
                      type="button"
                      aria-label="Filter paid fees"
                      onClick={() => setShowPaidFilter(open => !open)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #f97316, #8b5cf6)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          display: 'inline-block',
                          borderTopLeftRadius: 2,
                          borderTopRightRadius: 2,
                          borderBottomRightRadius: 4,
                          borderBottomLeftRadius: 4,
                          background: '#ffffff',
                          clipPath:
                            'polygon(15% 0, 85% 0, 60% 40%, 60% 100%, 40% 100%, 40% 40%)',
                        }}
                      />
                    </button>
                    {showPaidFilter && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 26,
                          right: 0,
                          background: 'var(--panel)',
                          borderRadius: 12,
                          border: '1px solid var(--panel-border)',
                          padding: '8px 10px',
                          boxShadow: '0 16px 32px rgba(15,23,42,0.25)',
                          zIndex: 30,
                          minWidth: 160,
                          fontSize: 11,
                        }}
                      >
                        {[
                          { key: 'all', label: 'All time' },
                          { key: 'today', label: 'Paid today' },
                          { key: 'week', label: 'Paid in last 7 days' },
                        ].map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setPaidWhen(opt.key as any)
                              setShowPaidFilter(false)
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '4px 6px',
                              borderRadius: 6,
                              border: 'none',
                              background:
                                paidWhen === opt.key ? 'rgba(59,130,246,0.12)' : 'transparent',
                              cursor: 'pointer',
                              marginBottom: 2,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="table" style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Receipt No.</th>
                        <th>Paid Date</th>
                        <th>Amount</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaidParts.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: 12 }}>
                            <span className="note">No fees have been marked as paid yet.</span>
                          </td>
                        </tr>
                      )}
                      {filteredPaidParts.map(({ p, idx }) => (
                        <tr key={idx}>
                          <td>{7247 + idx}</td>
                          <td>
                            {p.dueDate
                              ? new Date(p.dueDate).toLocaleDateString()
                              : updatedAt
                                ? new Date(updatedAt).toLocaleDateString()
                                : '-'}
                          </td>
                          <td>
                            {Number(p.amount || 0).toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </td>
                          <td>
                            <button
                              className="btn-ghost"
                              type="button"
                              style={{ fontSize: 12, padding: '2px 6px' }}
                            >
                              See Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Online Recent Transactions table (placeholder) */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>
                    Online Recent Transactions
                  </div>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', gap:6 }}>
                    <button
                      type="button"
                      aria-label="Filter online transactions"
                      onClick={() => setShowTransFilter(open => !open)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          display: 'inline-block',
                          borderTopLeftRadius: 2,
                          borderTopRightRadius: 2,
                          borderBottomRightRadius: 4,
                          borderBottomLeftRadius: 4,
                          background: '#ffffff',
                          clipPath:
                            'polygon(15% 0, 85% 0, 60% 40%, 60% 100%, 40% 100%, 40% 40%)',
                        }}
                      />
                    </button>
                    {showTransFilter && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 26,
                          right: 0,
                          background: 'var(--panel)',
                          borderRadius: 12,
                          border: '1px solid var(--panel-border)',
                          padding: '8px 10px',
                          boxShadow: '0 16px 32px rgba(15,23,42,0.25)',
                          zIndex: 30,
                          minWidth: 170,
                          fontSize: 11,
                        }}
                      >
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'paid', label: 'Paid (all time)' },
                          { key: 'pending', label: 'Pending' },
                          { key: 'paid_today', label: 'Paid today' },
                          { key: 'paid_week', label: 'Paid in last 7 days' },
                        ].map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setTransFilter(opt.key as any)
                              setShowTransFilter(false)
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '4px 6px',
                              borderRadius: 6,
                              border: 'none',
                              background:
                                transFilter === opt.key
                                  ? 'rgba(34,197,94,0.15)'
                                  : 'transparent',
                              cursor: 'pointer',
                              marginBottom: 2,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="table" style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Transaction No.</th>
                        <th>Date</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdhoc.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: 12 }}>
                            <span className="note">
                              No online transactions recorded for this filter.
                            </span>
                          </td>
                        </tr>
                      )}
                      {filteredAdhoc.map((bill, idx) => (
                        <tr key={bill.id || idx}>
                          <td style={{ textTransform: 'capitalize' }}>
                            {bill.status ? bill.status.toLowerCase() : 'pending'}
                          </td>
                          <td>{bill.id}</td>
                          <td>
                            {bill.createdAt
                              ? new Date(bill.createdAt).toLocaleDateString()
                              : '-'}
                          </td>
                          <td>
                            {Number(bill.total || 0).toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
          </div>
        </div>
      </div>
    </div>
  )
}
