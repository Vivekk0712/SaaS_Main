"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

type Role = 'admissions' | 'principal' | 'accountant'

export default function StaffUnifiedLogin() {
  const router = useRouter()
  const [role, setRole] = React.useState<Role>('admissions')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [otpVerified, setOtpVerified] = React.useState(false)
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return alert('Enter credentials')
    if (!phone.trim() || !otp.trim()) return alert('Enter phone and OTP')
    if (!otpVerified) return alert('Please verify OTP before signing in')
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
              onClick={async () => {
                try {
                  const ph = phone.trim()
                  if (!ph) {
                    alert('Enter phone number before requesting OTP')
                    return
                  }
                  const r = await fetch('/api/otp/send', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ phone: ph }),
                  })
                  if (!r.ok) {
                    alert('Could not send OTP. Please try again.')
                    return
                  }
                  alert('OTP sent to your phone number.')
                  setOtpVerified(false)
                } catch {
                  alert('Could not send OTP. Please try again.')
                }
              }}
            >
              Send OTP
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  const ph = phone.trim()
                  if (!ph || !otp.trim()) {
                    alert('Enter phone and OTP before verifying')
                    return
                  }
                  const r = await fetch('/api/otp/verify', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ phone: ph, code: otp.trim() }),
                  })
                  if (!r.ok) {
                    alert('Invalid or expired OTP')
                    setOtpVerified(false)
                    return
                  }
                  setOtpVerified(true)
                } catch {
                  alert('Could not verify OTP. Please try again.')
                  setOtpVerified(false)
                }
              }}
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
