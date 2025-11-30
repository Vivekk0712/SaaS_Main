"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [reset, setReset] = React.useState(false)
  const [newPass, setNewPass] = React.useState('')
  const [confirmPass, setConfirmPass] = React.useState('')

  // Prefer fast local login; keep remote as a short-timeout fallback only.
  const remoteLoginWithTimeout = async (phone: string, password: string, timeoutMs = 2000) => {
    if (!API) throw new Error('no_remote_api')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const r = await fetch(`${API}/v1/onboarding/public/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        signal: controller.signal
      })
      if (!r.ok) throw new Error('bad_credentials')
    } finally {
      clearTimeout(timer)
    }
  }

  const localLogin = async (phone: string, password: string) => {
    const rl = await fetch('/api/local/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, password })
    })
    if (!rl.ok) {
      // 4xx -> invalid credentials, don't bother remote
      if (rl.status >= 400 && rl.status < 500) {
        throw new Error('invalid_credentials')
      }
      // 5xx -> local server issue, allow remote fallback
      throw new Error('local_server_error')
    }
  }

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (!phone || !password) return alert('Enter phone & password')
      try {
        // Try fast local login first (MySQL-backed unified auth)
        await localLogin(phone, password)
      } catch (err: any) {
        // If clearly bad credentials, fail fast without remote.
        if (err && err.message === 'invalid_credentials') {
          throw err
        }
        // Otherwise, attempt remote onboarding login with tight timeout.
        try {
          await remoteLoginWithTimeout(phone, password)
        } catch {
          throw new Error('login_failed')
        }
      }
      sessionStorage.setItem('onb:parent', JSON.stringify({ phone }))
      router.push('/application')
    } catch (e) {
      alert('Login failed. Check credentials or server.')
    } finally { setLoading(false) }
  }

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (!phone || !newPass || !confirmPass) return alert('Enter all fields')
      if (newPass !== confirmPass) return alert('Passwords do not match')
      // Update in local DB (also syncs profiles)
      const r = await fetch('/api/local/password/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, newPassword: newPass }) })
      if (!r.ok) throw new Error('reset_failed')
      alert('Password updated. Please login with new password.')
      setReset(false); setNewPass(''); setConfirmPass('')
    } catch { alert('Reset failed') } finally { setLoading(false) }
  }

  return (
    <div className="container login-shell login-shell-parent">
      <div className="auth-card">
        <h1 className="title">Parent Login</h1>
        {!reset ? (
        <form onSubmit={login}>
          <label className="label">Phone Number</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="button" type="submit" disabled={loading}>{loading? 'Logging in…' : 'Login'}</button>
          <div className="note" style={{ marginTop: 8 }}><button className="btn-ghost" type="button" onClick={()=>setReset(true)}>Forgot password?</button></div>
        </form>
        ) : (
        <form onSubmit={doReset}>
          <label className="label">Phone Number</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
          <label className="label">New Password</label>
          <input className="input" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} />
          <label className="label">Confirm New Password</label>
          <input className="input" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} />
          <div className="actions" style={{ display:'flex', gap:8 }}>
            <button className="button" type="submit" disabled={loading}>{loading? 'Saving…' : 'Update Password'}</button>
            <button className="button secondary" type="button" onClick={()=> setReset(false)}>Cancel</button>
          </div>
        </form>
        )}
        <p className="note">New parent? <a href="/signup">Create parent account</a></p>
      </div>
    </div>
  )
}
