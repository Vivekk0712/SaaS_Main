"use client"
import React from 'react'

export default function AdminResetPage() {
  const [status, setStatus] = React.useState<'idle'|'working'|'done'|'error'>('idle')
  const [msg, setMsg] = React.useState<string>('')

  const clearBrowserData = async () => {
    try {
      // Clear local/session storage
      try { localStorage.clear() } catch {}
      try { sessionStorage.clear() } catch {}
      // Clear caches (service worker cache)
      try { if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))) } } catch {}
      // Best-effort IndexedDB cleanup (not supported in all browsers)
      try {
        const anyWin: any = window as any
        if (anyWin.indexedDB && anyWin.indexedDB.databases) {
          const dbs = await anyWin.indexedDB.databases()
          await Promise.all((dbs || []).map((d: any) => (d?.name ? anyWin.indexedDB.deleteDatabase(d.name) : Promise.resolve())))
        }
      } catch {}
    } catch {}
  }

  const onReset = async () => {
    setStatus('working'); setMsg('Resetting…')
    try {
      const r = await fetch('/api/local/admin/reset', { method: 'POST' })
      if (!r.ok) throw new Error('reset_failed')
      await clearBrowserData()
      setStatus('done'); setMsg('Database cleared. Local cache cleared.')
    } catch (e: any) {
      setStatus('error'); setMsg('Reset failed. Please try again.')
    }
  }

  const onReload = () => { try { location.reload() } catch {} }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className="title">Admin • Reset Data</h1>
        <p className="subtitle">Wipe shared local DB (onboarding + SAS) and clear this browser&apos;s caches.</p>

        <div className="note" style={{ marginBottom: 12 }}>
          This removes all parents, applications, fees, profiles, attendance, marks, academics, and ad‑hoc bills from the local demo DB (data/local-db.json) and clears your browser storage for a clean test.
        </div>

        <div className="actions" style={{ justifyContent:'space-between' }}>
          <button className="btn" type="button" onClick={onReset} disabled={status==='working'}>
            {status==='working' ? 'Resetting…' : 'Reset DB + Clear Browser Cache'}
          </button>
          <button className="btn-ghost" type="button" onClick={onReload}>Reload App</button>
        </div>

        {msg && <div className="note" style={{ marginTop: 10 }}>{msg}</div>}
      </div>
    </div>
  )
}

