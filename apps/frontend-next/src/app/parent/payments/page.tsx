"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent } from '../../teacher/data'

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
  const [studentName, setStudentName] = React.useState<string>('')
  const [studentClassSection, setStudentClassSection] = React.useState<string>('')
  const [adhoc, setAdhoc] = React.useState<Array<{ id:string; title:string; total:number; createdAt:string; status?:string }>>([])
  const [selectedAdhocIds, setSelectedAdhocIds] = React.useState<string[]>([])
  const [billDetails, setBillDetails] = React.useState<any | null>(null)
  const [showPaidFilter, setShowPaidFilter] = React.useState(false)
  const [paidWhen, setPaidWhen] = React.useState<'all' | 'today' | 'week'>('all')
  const [showTransFilter, setShowTransFilter] = React.useState(false)
  const [transFilter, setTransFilter] = React.useState<'all' | 'paid' | 'pending' | 'paid_today' | 'paid_week'>('all')

  const phone = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('parent') || '{}').phone || '' } catch { return '' }
  }, [])

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('parent')
      if (!raw) return
      const { roll } = JSON.parse(raw)
      if (!roll) return
      const me = findStudent(String(roll))
      if (!me) return
      setStudentName(me.name || '')
      const cs = [me.klass, me.section].filter(Boolean).join(' ')
      setStudentClassSection(cs)
    } catch {}
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

  const scheduledTotal = items.reduce((s,it)=> s + Number(it.amount||0), 0)
  const scheduledDue = parts.reduce((s, p, idx) => s + (!paid[idx] ? Number(p.amount||0) : 0), 0)
  const scheduledPaid = scheduledTotal - scheduledDue

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

  const selectedAdhocBills = React.useMemo(() => {
    if (!selectedAdhocIds.length) return []
    return adhoc.filter(b => selectedAdhocIds.includes(String(b.id)))
  }, [adhoc, selectedAdhocIds])

  const canMultiPay = selectedAdhocBills.some(
    b => (b.status || '').toLowerCase() !== 'paid'
  )
  const selectedTotal = selectedAdhocBills.reduce(
    (sum, b) => sum + (Number(b.total || 0) || 0),
    0
  )

  const payMultipleAdhoc = async () => {
    const unpaid = selectedAdhocBills.filter(
      b => (b.status || '').toLowerCase() !== 'paid'
    )
    if (!unpaid.length) {
      alert('Select at least one pending invoice.')
      return
    }
    const amount = unpaid.reduce((sum, b) => sum + (Number(b.total || 0) || 0), 0)
    const description = unpaid.length > 1 ? `Multiple invoices (${unpaid.length})` : (unpaid[0].title || 'Additional Fee')
    const invoiceId = `ADHOC_MULTI_${Date.now()}`

    await payWithRazorpay(amount, description, invoiceId, async () => {
      try {
        for (const bill of unpaid) {
          await fetch('/api/local/parent/fees/adhoc/pay', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ billId: bill.id }),
          })
        }
        setSelectedAdhocIds([])
        await load(true)
      } catch (error) {
        console.error('Failed to update multi-payment status:', error)
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

  const adhocTotals = React.useMemo(() => {
    if (!adhoc.length) {
      return { total: 0, paid: 0, pending: 0 }
    }
    let total = 0
    let paid = 0
    for (const bill of adhoc) {
      const amt = Number(bill.total || 0) || 0
      total += amt
      if ((bill.status || '').toLowerCase() === 'paid') paid += amt
    }
    const pending = total - paid
    return { total, paid, pending }
  }, [adhoc])

  const summaryTotal = scheduledTotal + adhocTotals.total
  const summaryDue = scheduledDue + adhocTotals.pending
  const summaryPaid = summaryTotal - summaryDue

  const openReceiptWindow = (row: {
    invoiceNo: string
    title: string
    receiptNo: string
    transactionId: string
    amount: number
    date: string
  }) => {
    if (typeof window === 'undefined') return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const formattedDate = new Date(row.date).toLocaleDateString('en-IN')
    const amountStr = row.amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    })
    const title = row.title || 'Fee payment'
    const stuName = studentName || 'Student'
    const cls = studentClassSection || 'Class / Section'

    win.document.write(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Fee Receipt - ${row.receiptNo}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #111827; }
      .header { text-align: center; margin-bottom: 16px; }
      .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
      .header h2 { margin: 4px 0 0; font-size: 14px; letter-spacing: 0.08em; }
      .meta { display: flex; justify-content: space-between; font-size: 13px; margin-top: 16px; }
      .meta div { line-height: 1.6; }
      .table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
      .table th, .table td { border: 1px solid #111827; padding: 6px 8px; }
      .table th { background: #f3f4f6; text-align: left; }
      .totals { margin-top: 20px; font-size: 13px; }
      .totals div { margin-bottom: 4px; }
      .footer { margin-top: 32px; font-size: 11px; color: #4b5563; text-align: center; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Gopalan Group of Institutions</h1>
      <h2>RECEIPT</h2>
    </div>
    <div class="meta">
      <div>
        <div><strong>Receipt No.</strong> : ${row.receiptNo}</div>
        <div><strong>Student's Name</strong> : ${stuName}</div>
        <div><strong>Class/Section</strong> : ${cls}</div>
        <div><strong>Payment Mode</strong> : Online</div>
      </div>
      <div>
        <div><strong>Date</strong> : ${formattedDate}</div>
        <div><strong>Invoice No.</strong> : ${row.invoiceNo}</div>
        <div><strong>Transaction ID</strong> : ${row.transactionId}</div>
      </div>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th style="width: 60px;">Sl. No.</th>
          <th>Particulars</th>
          <th style="width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${title}</td>
          <td>${amountStr}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals">
      <div><strong>Transaction Amount:</strong> ${amountStr}</div>
      <div><strong>Fine Amount:</strong> 0.00</div>
      <div><strong>Pending Amount:</strong> 0.00</div>
      <div><strong>Total:</strong> ${amountStr}</div>
    </div>
    <div class="footer">
      This is a computer-generated receipt. You may save it as PDF from the print dialog.
    </div>
    <script>
      window.onload = function() { window.print(); };
    </script>
  </body>
</html>`)
    win.document.close()
  }

  const openAdhocBillWindow = (bill: any) => {
    if (typeof window === 'undefined') return
    const win = window.open('', '_blank', 'width=980,height=720')
    if (!win) return
    const created = bill?.createdAt ? new Date(bill.createdAt) : null
    const paidAt = bill?.paidAt ? new Date(bill.paidAt) : null
    const fmtDate = (d: Date | null) => (d && !Number.isNaN(d.getTime()) ? d.toLocaleString('en-IN') : '—')
    const fmtAmt = (n: any) =>
      Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

    const title = String(bill?.title || 'Additional Fee')
    const billId = String(bill?.id || '')
    const status = String(bill?.status || 'pending')
    const items: Array<{ label?: string; amount?: number }> = Array.isArray(bill?.items) ? bill.items : []
    const total = items.reduce((s, it) => s + Number(it?.amount || 0), 0) || Number(bill?.total || 0) || 0

    const stuName = studentName || String(bill?.name || 'Student')
    const cls = studentClassSection || 'Class / Section'
    const invoiceNo = billId ? `ADHOC/${billId.slice(-6)}` : 'ADHOC'

    win.document.write(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Bill - ${invoiceNo}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 28px; color: #111827; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; gap: 16px; }
      .brand h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.04em; }
      .brand div { margin-top: 4px; font-size: 12px; color: #4b5563; }
      .pill { display:inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
      .paid { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
      .pending { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
      .grid { margin-top: 16px; display:grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
      .card { border: 1px solid #11182722; border-radius: 14px; padding: 10px 12px; background: #ffffff; }
      .label { font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
      .value { margin-top: 4px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      th, td { border: 1px solid #11182733; padding: 8px 10px; }
      th { background: #f3f4f6; text-align: left; }
      .right { text-align: right; }
      .totals { margin-top: 14px; display:flex; justify-content:flex-end; }
      .totals .card { width: min(420px, 100%); }
      .footer { margin-top: 24px; font-size: 11px; color: #4b5563; text-align:center; }
      @media print { .no-print { display:none; } body { margin: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="brand">
        <h1>School SAS</h1>
        <div>Bill / Invoice</div>
      </div>
      <div>
        <div class="pill ${status.toLowerCase()==='paid' ? 'paid' : 'pending'}">${status.toUpperCase()}</div>
        <div style="margin-top:8px; font-size:12px; color:#4b5563;">Invoice: <strong>${invoiceNo}</strong></div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Student</div>
        <div class="value">${stuName}</div>
        <div style="margin-top:6px; color:#4b5563;">${cls}</div>
      </div>
      <div class="card">
        <div class="label">Title</div>
        <div class="value">${title}</div>
        <div style="margin-top:6px; color:#4b5563;">Bill ID: ${billId || '—'}</div>
      </div>
      <div class="card">
        <div class="label">Created</div>
        <div class="value">${fmtDate(created)}</div>
      </div>
      <div class="card">
        <div class="label">Paid At</div>
        <div class="value">${fmtDate(paidAt)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:60px;">S. No</th>
          <th>Particulars</th>
          <th class="right" style="width:160px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${
          items.length
            ? items
                .map(
                  (it, idx) => `<tr>
          <td>${idx + 1}</td>
          <td>${String(it?.label || 'Fee')}</td>
          <td class="right">${fmtAmt(it?.amount || 0)}</td>
        </tr>`
                )
                .join('')
            : `<tr><td>1</td><td>${title}</td><td class="right">${fmtAmt(total)}</td></tr>`
        }
      </tbody>
    </table>

    <div class="totals">
      <div class="card">
        <div class="label">Total</div>
        <div class="value" style="font-size:16px;">${fmtAmt(total)}</div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated invoice. You may save it as PDF from the print dialog.
      <div class="no-print" style="margin-top:10px;"><button onclick="window.print()">Print / Save as PDF</button></div>
    </div>
  </body>
</html>`)
    win.document.close()
  }

  const historyRows = React.useMemo(() => {
    type Row = {
      kind: 'installment' | 'adhoc'
      key: string
      invoiceNo: string
      title: string
      transactionId: string
      receiptNo: string
      invoiceAmount: number
      amountPaid: number
      date: string
      mode: string
      status: string
      sourceIndex?: number
      sourceId?: string
    }
    const rows: Row[] = []

    filteredPaidParts.forEach(({ p, idx }, i) => {
      const amount = Number(p.amount || 0)
      const dateStr = p.dueDate || updatedAt || new Date().toISOString()
      rows.push({
        kind: 'installment',
        key: `inst-${idx}`,
        invoiceNo: appId ? `${appId}/INST/${idx + 1}` : `INST-${idx + 1}`,
        title: p.label || `Installment ${idx + 1}`,
        transactionId: `TXN-INST-${idx + 1}`,
        receiptNo: `RCPT-INST-${idx + 1}`,
        invoiceAmount: amount,
        amountPaid: amount,
        date: dateStr,
        mode: 'Online',
        status: 'Payment Received',
        sourceIndex: idx,
      })
    })

    const paidAdhoc = filteredAdhoc.filter(
      (b) => (b.status || '').toLowerCase() === 'paid',
    )
    paidAdhoc.forEach((bill, i) => {
      const amount = Number(bill.total || 0)
      const dateStr = bill.createdAt || updatedAt || new Date().toISOString()
      rows.push({
        kind: 'adhoc',
        key: `adhoc-${bill.id || i}`,
        invoiceNo: bill.id ? `ADHOC/${String(bill.id).slice(-6)}` : `ADHOC-${i + 1}`,
        title: bill.title || 'Additional Fee',
        transactionId: bill.id || `TXN-ADHOC-${i + 1}`,
        receiptNo: bill.id ? `RCPT-${String(bill.id).slice(-6)}` : `RCPT-ADHOC-${i + 1}`,
        invoiceAmount: amount,
        amountPaid: amount,
        date: dateStr,
        mode: 'Online',
        status: 'Payment Received',
        sourceId: bill.id,
      })
    })

    return rows.sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return db - da
    })
  }, [filteredPaidParts, filteredAdhoc, appId, updatedAt])

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
                      {summaryTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
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
                      {summaryPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
                        color: summaryDue ? '#b91c1c' : 'var(--success)',
                      }}
                    >
                      {summaryDue.toLocaleString('en-IN', {
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
                {summaryDue === 0 ? (
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
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 18,
                        marginBottom: 4,
                      }}
                    >
                      {summaryDue.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </div>
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
          {false && adhoc.length > 0 && (
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

          {/* Invoices view for adhoc fees (exam / revaluation etc.) */}
          {adhoc.length > 0 && (
            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div>
                  {studentName && (
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Child Name : {studentName}</div>
                  )}
                  <div style={{ fontWeight: 700 }}>
                    Total Pending Amount :{' '}
                    {summaryDue.toLocaleString('en-IN', {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 10 }}>Invoices</div>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid rgba(51,65,85,0.35)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  disabled={!canMultiPay}
                  onClick={payMultipleAdhoc}
                >
                  Multiple Pay{selectedTotal > 0 ? ` (${selectedTotal.toLocaleString('en-IN')})` : ''}
                </button>
              </div>
              <div className="table" style={{ fontSize: 12 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>
                        <input
                          type="checkbox"
                          checked={
                            adhoc.some(b => (b.status || '').toLowerCase() !== 'paid') &&
                            adhoc
                              .filter(b => (b.status || '').toLowerCase() !== 'paid')
                              .every(b => selectedAdhocIds.includes(String(b.id)))
                          }
                          onChange={(e) => {
                            const pending = adhoc.filter(b => (b.status || '').toLowerCase() !== 'paid')
                            if (!pending.length) return
                            if (e.target.checked) {
                              setSelectedAdhocIds(pending.map(b => String(b.id)))
                            } else {
                              setSelectedAdhocIds([])
                            }
                          }}
                        />
                      </th>
                      <th>INVOICE NO</th>
                      <th>TITLE</th>
                      <th>INVOICE AMOUNT</th>
                      <th>PAID AMOUNT</th>
                      <th>PENDING AMOUNT</th>
                      <th>DUE DATE</th>
                      <th>FINE</th>
                      <th>VIEW BILL DETAILS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adhoc.map((bill, idx) => {
                      const isPaid = (bill.status || '').toLowerCase() === 'paid'
                      const amount = Number(bill.total || 0) || 0
                      const paidAmount = isPaid ? amount : 0
                      const pendingAmount = isPaid ? 0 : amount
                      const invoiceNo = bill.id ? String(bill.id) : `ADHOC-${idx + 1}`
                      const isChecked = selectedAdhocIds.includes(String(bill.id))
                      return (
                        <tr key={bill.id || idx}>
                          <td>
                            <input
                              type="checkbox"
                              disabled={isPaid}
                              checked={isChecked}
                              onChange={(e) => {
                                const id = String(bill.id)
                                setSelectedAdhocIds(prev => {
                                  if (e.target.checked) return prev.includes(id) ? prev : [...prev, id]
                                  return prev.filter(x => x !== id)
                                })
                              }}
                            />
                          </td>
                          <td>{invoiceNo}</td>
                          <td style={{ fontWeight: 600 }}>{bill.title || 'Additional Fee'}</td>
                          <td>{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td>{paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td>{pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td>
                            {bill.createdAt
                              ? new Date(bill.createdAt).toLocaleDateString()
                              : '-'}
                          </td>
                          <td>0</td>
                          <td>
                            <button
                              type="button"
                              className="btn-ghost"
                              style={{ fontSize: 11, padding: '4px 10px' }}
                              onClick={() => setBillDetails(bill)}
                            >
                              View Bill Details
                            </button>
                          </td>
                          <td>
                            {!isPaid ? (
                              <button
                                className="btn"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => payAdhoc(bill.id)}
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="note">Payment Received</span>
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

          {/* Bottom: Payment history with receipts */}
          <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                Payment History{studentName ? ` for ${studentName}` : ''}
              </div>
              <p className="note" style={{ marginTop: 4 }}>
                View all completed payments and download receipts.
              </p>
            </div>
            <div className="table" style={{ fontSize: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>S. No</th>
                    <th>Invoice No</th>
                    <th>Invoice Title</th>
                    <th>Transaction ID</th>
                    <th>Receipt No</th>
                    <th>Invoice Amount</th>
                    <th>Amount Paid</th>
                    <th>Payment Date</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>View Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: 12 }}>
                        <span className="note">
                          No payments have been recorded yet. Receipts will appear here after
                          successful payments.
                        </span>
                      </td>
                    </tr>
                  )}
                  {historyRows.map((row, idx) => (
                    <tr key={row.key}>
                      <td>{idx + 1}</td>
                      <td>{row.invoiceNo}</td>
                      <td>{row.title}</td>
                      <td>{row.transactionId}</td>
                      <td>{row.receiptNo}</td>
                      <td>
                        {row.invoiceAmount.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        })}
                      </td>
                      <td>
                        {row.amountPaid.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        })}
                      </td>
                      <td>{new Date(row.date).toLocaleDateString()}</td>
                      <td>{row.mode}</td>
                      <td>{row.status}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          onClick={() =>
                            openReceiptWindow({
                              invoiceNo: row.invoiceNo,
                              title: row.title,
                              receiptNo: row.receiptNo,
                              transactionId: row.transactionId,
                              amount: row.amountPaid,
                              date: row.date,
                            })
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
          </div>
        </div>
      </div>

      {billDetails && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setBillDetails(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 80,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(920px, 96vw)',
              maxHeight: 'min(86vh, 720px)',
              overflow: 'auto',
              background: 'var(--panel)',
              borderRadius: 18,
              padding: 16,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              border: '1px solid rgba(148,163,184,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Bill Details</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {(billDetails.status || '').toLowerCase() !== 'paid' && billDetails.id ? (
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={async () => {
                      const id = String(billDetails.id || '')
                      setBillDetails(null)
                      await payAdhoc(id)
                    }}
                  >
                    Pay Now
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setBillDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 12, borderRadius: 14, boxShadow: 'none' }}>
                <div className="label">Invoice</div>
                <div style={{ fontWeight: 800, marginTop: 4 }}>{String(billDetails.id || '')}</div>
                <div className="note" style={{ marginTop: 6 }}>
                  Status: {(billDetails.status || 'pending').toString()}
                </div>
              </div>
              <div className="card" style={{ padding: 12, borderRadius: 14, boxShadow: 'none' }}>
                <div className="label">Amount</div>
                <div style={{ fontWeight: 800, marginTop: 4 }}>
                  {Number(billDetails.total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </div>
                <div className="note" style={{ marginTop: 6 }}>
                  Date:{' '}
                  {billDetails.createdAt ? new Date(billDetails.createdAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 12, borderRadius: 14, boxShadow: 'none', marginTop: 12 }}>
              <div className="label">Title</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>{billDetails.title || 'Additional Fee'}</div>
              {billDetails.description ? (
                <div className="note" style={{ marginTop: 6 }}>
                  {String(billDetails.description)}
                </div>
              ) : null}
            </div>

            <div className="card" style={{ padding: 12, borderRadius: 14, boxShadow: 'none', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div className="label">Bill Items</div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999 }}
                  onClick={() => openAdhocBillWindow(billDetails)}
                >
                  Print / Save PDF
                </button>
              </div>
              <div className="table" style={{ marginTop: 8, fontSize: 12 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>S. No</th>
                      <th>Particulars</th>
                      <th style={{ width: 140, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(billDetails.items) ? billDetails.items : []).length ? (
                      (billDetails.items as any[]).map((it, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{String(it?.label || 'Fee')}</td>
                          <td style={{ textAlign: 'right' }}>
                            {Number(it?.amount || 0).toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td>1</td>
                        <td>{billDetails.title || 'Additional Fee'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {Number(billDetails.total || 0).toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          })}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'right', fontWeight: 800 }}>
                        Total
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {Number(billDetails.total || 0).toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="parent-logout-fab"
        onClick={() => {
          try {
            sessionStorage.removeItem('parent')
          } catch {}
          try {
            window.location.href = '/'
          } catch {}
        }}
        aria-label="Logout"
      >
        ⏻
      </button>
      <span className="parent-logout-label">Logout</span>
    </div>
  )
}
