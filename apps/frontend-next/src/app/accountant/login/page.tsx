"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function AccountantLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [otpVerified, setOtpVerified] = React.useState(false)
  const [googlePhone, setGooglePhone] = React.useState('')

  const notifyOtpDisabled = React.useCallback(() => {
    alert('OTP is temporarily disabled on this login page.')
  }, [])

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
  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return alert('Enter credentials')
    if (password !== '12345') return alert('Wrong password. Use 12345')
    sessionStorage.setItem('staff:accountant', JSON.stringify({ email }))
    try {
      if (phone.trim()) {
        fetch('/api/notify/whatsapp-login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ phone, role: 'accountant' }),
        }).catch(() => {})
      }
    } catch {}
    router.push('/accountant/dashboard')
  }
  return (
    <div className="container login-shell login-shell-staff"><div className="auth-card">
      <h1 className="title">Accountant Login</h1>
      <form onSubmit={login}>
        <label className="label">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="label">Verification Phone</label>
        <input className="input" value={phone} onChange={e=>{ setPhone(e.target.value); setOtpVerified(false) }} placeholder="e.g. +91 9xxxxxxxxx" />
        <label className="label">OTP</label>
        <div style={{ display:'flex', gap:8, marginBottom:6 }}>
          <input className="input" value={otp} onChange={e=>{ setOtp(e.target.value); setOtpVerified(false) }} placeholder="Enter OTP" />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button
            type="button"
            className="button"
            onClick={notifyOtpDisabled}
          >
            Send OTP
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={notifyOtpDisabled}
          >
            Verify OTP
          </button>
          {otpVerified && (
            <span
              style={{
                color: '#16a34a',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                animation: 'otp-pop 0.25s ease-out',
              }}
            >
              <span>✓</span>
              <span>Verified</span>
            </span>
          )}
        </div>
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
