"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

type Role = 'admissions' | 'principal' | 'accountant'

export default function StaffUnifiedLogin() {
  const router = useRouter()
  const [role, setRole] = React.useState<Role>('admissions')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [googlePhone, setGooglePhone] = React.useState('')

  const startOAuth = React.useCallback(() => {
    if (typeof window === 'undefined') return
    const phone = googlePhone.trim()
    if (!phone) {
      alert('Enter phone number before continuing with Google')
      return
    }
    try {
      sessionStorage.setItem('oauthPhone', phone)
      sessionStorage.setItem('oauthRole', 'admin')
    } catch {
      // ignore storage errors
    }
    const url = `/api/auth/oauth/start?role=admin`
    window.location.href = url
  }, [googlePhone])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return alert('Enter credentials')
    if (password !== '12345') return alert('Wrong password. Use 12345')
    setLoading(true)
    try {
      sessionStorage.setItem(`staff:${role}`, JSON.stringify({ email }))
      switch (role) {
        case 'admissions': router.push('/admissions/dashboard'); break
        case 'principal': router.push('/principal/dashboard'); break
        case 'accountant': router.push('/accountant/dashboard'); break
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container login-shell login-shell-staff">
      <div className="auth-card">
        <h1 className="title">Staff Login</h1>
        <p className="subtitle">Choose your role and sign in.</p>
        <form onSubmit={submit}>
          <label className="label">Role</label>
          <select className="input select" value={role} onChange={e=>setRole(e.target.value as Role)}>
            <option value="admissions">Admissions</option>
            <option value="principal">Principal</option>
            <option value="accountant">Accountant</option>
          </select>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>{loading? 'Signing in…' : 'Sign In'}</button>
          </div>
        </form>
        <div className="google-login-row">
          <input
            className="input google-phone-input"
            placeholder="Phone number for Google"
            value={googlePhone}
            onChange={(e) => setGooglePhone(e.target.value)}
          />
          <button
            className="google-btn"
            type="button"
            onClick={startOAuth}
          >
            <span className="google-btn-icon">
              <img src="/google-logo.svg" alt="Google logo" />
            </span>
            Continue with Google
          </button>
        </div>
        <p className="note">Parent? Use the onboarding site on port 3020.</p>
      </div>
    </div>
  )
}
