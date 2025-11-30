"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

export default function SignupPage() {
  const router = useRouter()
  const [phone, setPhone] = React.useState('')
  const [parentName, setParentName] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !parentName || !password || !confirm) return alert('Fill all fields')
    if (password !== confirm) return alert('Passwords do not match')
    try {
      setLoading(true)
      if (API) {
        const r = await fetch(`${API}/v1/onboarding/public/signup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, parentName, password }) })
        if (!r.ok) throw new Error('signup_failed')
      }
      router.push('/login')
    } catch (e) {
      // Fallback to local file DB
      try {
        const r = await fetch('/api/local/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, parentName, password }) })
        if (!r.ok) throw new Error('local_failed')
        router.push('/login')
        return
      } catch {
        alert('Signup failed. Check server/local.');
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="container">
      <div className="auth-card">
        <h1 className="title">Create Parent Account</h1>
        <p className="subtitle">Access your child’s admission application.</p>
        <form onSubmit={submit}>
          <label className="label">Parent Name</label>
          <input className="input" value={parentName} onChange={e=>setParentName(e.target.value)} />
          <label className="label">Phone Number</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
          <label className="label">Set Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <label className="label">Confirm Password</label>
          <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          <button className="button" type="submit" disabled={loading}>{loading? 'Creating…' : 'Create Account'}</button>
        </form>
      </div>
    </div>
  )
}
