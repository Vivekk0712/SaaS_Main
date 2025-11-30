"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function AdmissionsLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
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
  const login = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return alert('Enter credentials')
    if (password !== '12345') return alert('Wrong password. Use 12345')
    sessionStorage.setItem('staff:admissions', JSON.stringify({ email }))
    router.push('/admissions/dashboard')
  }
  return (
    <div className="container"><div className="auth-card">
      <h1 className="title">Admissions Login</h1>
      <form onSubmit={login}>
        <label className="label">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn" type="submit">Login</button>
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
    </div></div>
  )
}
