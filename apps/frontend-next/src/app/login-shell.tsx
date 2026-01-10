"use client"
import React from 'react'
import { seedIfNeeded } from './teacher/data'
import { useRouter } from 'next/navigation'

type Role = '' | 'student' | 'parent' | 'admin' | 'teacher' | 'accountant'

type LoginShellProps = {
  initialOauthActive?: boolean
}

export default function LoginShell({ initialOauthActive = false }: LoginShellProps) {
  const router = useRouter()
  const [role, setRole] = React.useState<Role>('')
  const [phone, setPhone] = React.useState('')        // for student/parent
  const [name, setName] = React.useState('')         // for teacher/admin
  const [pass, setPass] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [otpVerified, setOtpVerified] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [oauthActive, setOauthActive] = React.useState(false)

  const hero = React.useMemo(() => {
    if (!role) {
      return {
        title: 'Gopalan Group of Institutions - your unified academic hub',
        subtitle:
          'One simple space for students, parents and staff to track academics, attendance and daily campus life.',
        cards: [
          'Access marks, attendance and updates in one place',
          'Stay connected with teachers and campus announcements',
          'Plan studies and activities with clear, timely information',
        ],
      }
    }
    if (role === 'student') {
      return {
        title: 'Welcome, student — your journey begins here',
        subtitle: 'Review your progress, attendance and daily diary in one focused space built just for you.',
        cards: [
          'See your marks and tests at a glance',
          'Understand your attendance month by month',
          'Plan your studies with daily updates'
        ]
      }
    }
    if (role === 'parent') {
      return {
        title: 'Welcome, parent — stay close to your child’s learning',
        subtitle: 'Track attendance, homework and progress without chasing notebooks or WhatsApp messages.',
        cards: [
          'Daily attendance and subject-wise summaries',
          'Know what homework and diary notes were shared',
          'View tests, marks and circulars in one place'
        ]
      }
    }
    if (role === 'teacher') {
      return {
        title: 'Welcome, teacher — manage your class with ease',
        subtitle: 'Mark attendance, publish homework, enter marks and share updates in a few quick steps.',
        cards: [
          'Fast per-period attendance and topics',
          'Share diary notes, materials and circulars',
          'See class performance and trends quickly'
        ]
      }
    }
    if (role === 'accountant') {
      return {
        title: 'Welcome, accountant — manage school finances',
        subtitle: 'Handle fee collection, invoices and payments with complete transparency and control.',
        cards: [
          'Assign fees and create invoices for students',
          'Track payments and pending dues',
          'Generate financial reports and receipts'
        ]
      }
    }
    // admin / HOD
    return {
      title: 'Welcome, HOD / Admin — your academic command centre',
      subtitle: 'See class performance, monitor attendance and keep parents informed from a single dashboard.',
      cards: [
        'Review subject-wise and class-wise analytics',
        'Monitor attendance health across the school',
        'Coordinate circulars, calendar and academics'
      ]
    }
  }, [role])

  React.useEffect(() => {
    try { seedIfNeeded() } catch { }
  }, [])

  // Handle Google OAuth callback mapping
  React.useEffect(() => {
    if (typeof document === 'undefined') return

    const mapFromOAuth = async () => {
      const getCookie = (name: string) => {
        const match = document.cookie
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith(name + '='))
        return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
      }

      const roleCookie = getCookie('oauth_role') as Role | ''
      const profileEncoded = getCookie('oauth_profile')
      if (!roleCookie || !profileEncoded) return

      let identifier = ''
      try {
        identifier = sessionStorage.getItem('oauthPhone') || ''
      } catch {
        identifier = ''
      }

      let profile: any = null
      try {
        profile = JSON.parse(atob(profileEncoded))
      } catch {
        profile = null
      }
      if (!profile) return

      const clearOAuthState = () => {
        document.cookie = 'oauth_role=; Max-Age=0; path=/'
        document.cookie = 'oauth_profile=; Max-Age=0; path=/'
        try {
          sessionStorage.removeItem('oauthPhone')
          sessionStorage.removeItem('oauthRole')
        } catch {
          // ignore
        }
      }

      try {
        setOauthActive(true)
        if (roleCookie === 'student') {
          let studentSession: any = {
            // Always use a neutral name; actual details come from DB via phone
            name: 'Student',
            roll: '',
            grade: '',
            section: '',
            photo: profile.picture || '',
            email: profile.email || '',
            phone: identifier || '',
          }
          try {
            if (identifier) {
              const resp = await fetch('/api/mysql/profiles/students')
              if (resp.ok) {
                const j = await resp.json()
                const mine = (j.items || []).find(
                  (x: any) =>
                    String(x.parentPhone || x.fatherPhone || '')
                      .trim() === String(identifier || '').trim()
                )
                if (mine) {
                  studentSession = {
                    name: String(mine.name || 'Student'),
                    roll: String(mine.usn || ''),
                    grade: String(mine.grade || mine.className || ''),
                    section: String(mine.section || ''),
                    photo: mine.photoDataUrl || profile.picture || '',
                    email: profile.email || '',
                    phone: identifier || '',
                  }
                }
              }
            }
          } catch {
            // fall back to generic studentSession
          }
          try { sessionStorage.setItem('student', JSON.stringify(studentSession)) } catch { }
          clearOAuthState()
          router.push('/student/dashboard')
          return
        }

        if (roleCookie === 'parent') {
          const parentSession: any = {
            phone: identifier || '',
            name: 'Parent',
            email: profile.email || '',
          }
          try {
            if (identifier) {
              const resp = await fetch('/api/mysql/profiles/students')
              if (resp.ok) {
                const j = await resp.json()
                const mine = (j.items || []).find(
                  (x: any) =>
                    String(x.parentPhone || x.fatherPhone || '')
                      .trim() === String(identifier || '').trim()
                )
                if (mine && mine.parentName) {
                  parentSession.name = String(mine.parentName)
                  parentSession.child = {
                    name: String(mine.name || ''),
                    roll: String(mine.usn || ''),
                    grade: String(mine.grade || mine.className || ''),
                    section: String(mine.section || ''),
                  }
                }
              }
            }
          } catch {
            // ignore lookup failures; parent pages can still resolve by phone
          }
          try { sessionStorage.setItem('parent', JSON.stringify(parentSession)) } catch { }
          clearOAuthState()
          router.push('/parent/dashboard')
          return
        }

        if (roleCookie === 'teacher') {
          const teacherName = identifier || profile.name || 'Teacher'
          const teacherSession: any = {
            name: teacherName,
            subject: '',
            email: profile.email || '',
          }
          try { sessionStorage.setItem('teacher', JSON.stringify(teacherSession)) } catch { }
          clearOAuthState()
          router.push('/teacher/dashboard')
          return
        }

        if (roleCookie === 'admin') {
          const adminSession: any = {
            user: identifier || profile.name || 'Admin',
            dept: 'General',
            email: profile.email || '',
          }
          try { sessionStorage.setItem('admin', JSON.stringify(adminSession)) } catch { }
          clearOAuthState()
          router.push('/admin/dashboard')
          return
        }
      } finally {
        setOauthActive(false)
      }
    }

    mapFromOAuth().catch(() => { })
  }, [router])

  const startOAuth = React.useCallback(() => {
    if (typeof window === 'undefined') return
    if (!role) {
      alert('Please select a role before continuing with Google')
      return
    }
    try {
      let identifier = ''
      if (role === 'student' || role === 'parent') {
        identifier = phone.trim()
        if (!identifier) {
          alert('Enter phone number before continuing with Google')
          return
        }
      } else if (role === 'teacher' || role === 'admin') {
        identifier = name.trim()
        if (!identifier) {
          alert('Enter name before continuing with Google')
          return
        }
      }

      try {
        if (identifier) {
          sessionStorage.setItem('oauthPhone', identifier)
        }
        sessionStorage.setItem('oauthRole', role)
      } catch {
        // ignore storage errors
      }

      const url = `/api/auth/oauth/start?role=${encodeURIComponent(role)}`
      window.location.href = url
    } catch {
      // ignore; user can still use password login
    }
  }, [role, phone, name])

  const notifyOtpDisabled = React.useCallback(() => {
    alert('OTP is temporarily disabled on this login page.')
  }, [])

  const resetFields = (r: Role) => {
    setError('')
    setPass('')
    setOtp('')
    setOtpVerified(false)
    if (r === 'student' || r === 'parent') {
      setPhone('')
      setName('')
    } else {
      setName('')
      setPhone('')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!role) {
      setError('Please select a role')
      return
    }
    setLoading(true)
    try {
      switch (role) {
        case 'student': {
          const ph = phone.trim()
          if (!ph) throw new Error('Enter phone number')
          if (!pass.trim()) throw new Error('Enter password')
          const r = await fetch('/api/local/profiles/student/resolve', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ fatherPhone: ph, password: pass.trim() })
          })
          if (!r.ok) throw new Error('Invalid phone or password')
          const j = await r.json()
          const session = {
            name: j.name,
            roll: j.roll || '',
            grade: j.grade,
            section: j.section || '',
            photo: j.photoDataUrl || '',
            phone: ph
          }
          sessionStorage.setItem('student', JSON.stringify(session))
          try { fetch('/api/notify/whatsapp-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: ph, role: 'student' }) }).catch(() => {}) } catch {}
          router.push('/student/dashboard')
          break
        }
        case 'parent': {
          const ph = phone.trim()
          if (!ph || !pass.trim()) throw new Error('Enter phone and password')
          const r = await fetch('/api/local/profiles/parent/resolve', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ phone: ph, password: pass.trim() })
          })
          if (!r.ok) throw new Error('Invalid phone or password')
          const j = await r.json()
          const session = { phone: j.phone, name: j.parentName }
          sessionStorage.setItem('parent', JSON.stringify(session))
          try { fetch('/api/notify/whatsapp-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: ph, role: 'parent' }) }).catch(() => {}) } catch {}
          router.push('/parent/dashboard')
          break
        }
        case 'teacher': {
          const nm = name.trim()
          if (!nm) throw new Error('Enter teacher name')
          if (!phone.trim()) throw new Error('Enter verification phone')
          if (pass !== '12345') throw new Error('Teacher password must be 12345 (temporary)')
          let raw = localStorage.getItem('school:teachers')
          let teachers = raw ? JSON.parse(raw) : []
          if (!Array.isArray(teachers) || !teachers.length) {
            try {
              const j = await (await fetch('/api/mysql/teachers/list')).json()
              if (j && Array.isArray(j.items)) {
                teachers = j.items
                try { localStorage.setItem('school:teachers', JSON.stringify(teachers)) } catch { }
              }
            } catch { }
          }
          const t = teachers.find((x: any) => String(x.name || '').trim().toLowerCase() === nm.toLowerCase())
          if (!t) throw new Error('Unknown teacher. Use a valid teacher name.')
          const primary =
            Array.isArray(t.subjects) && t.subjects.length
              ? t.subjects[0]
              : String(t.subject || '')
          sessionStorage.setItem('teacher', JSON.stringify({ name: t.name, subject: primary }))
          try { fetch('/api/notify/whatsapp-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, role: 'teacher' }) }).catch(() => {}) } catch {}
          router.push('/teacher/dashboard')
          break
        }
        case 'accountant': {
          const nm = name.trim()
          if (!nm) throw new Error('Enter accountant name')
          if (pass !== '12345') throw new Error('Passcode must be 12345 (temporary)')
          sessionStorage.setItem('accountant', JSON.stringify({ name: nm }))
          try { fetch('/api/notify/whatsapp-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, role: 'accountant' }) }).catch(() => {}) } catch {}
          router.push('/accountant/dashboard')
          break
        }
        case 'admin': {
          const nm = name.trim()
          if (!nm) throw new Error('Enter name')
          if (!phone.trim()) throw new Error('Enter verification phone')
          if (pass !== '12345') throw new Error('Passcode must be 12345 (temporary)')
          const dept = 'General'
          sessionStorage.setItem('admin', JSON.stringify({ user: nm, dept }))
          try { fetch('/api/notify/whatsapp-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, role: 'admin' }) }).catch(() => {}) } catch {}
          router.push('/admin/dashboard')
          break
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container login-shell">
      {oauthActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.70)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div className="auth-card" style={{ maxWidth: 360 }}>
            <div className="brand">
              <span className="dot" />
              <strong>School SAS</strong>
            </div>
            <h1 className="title">Signing you in…</h1>
            <p className="subtitle">
              Connecting to your account with Google. This will just take a moment.
            </p>
            <div className="oauth-loader" aria-hidden="true">
              <span className="oauth-loader-dot" />
              <span className="oauth-loader-dot" />
              <span className="oauth-loader-dot" />
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'stretch',
          width: '100%',
          maxWidth: 1120,
        }}
      >
        <section className="login-hero" aria-label="Gopalan Group of Institutions overview">
          <div style={{ marginBottom: 18 }}>
            <div className="login-hero-title">{hero.title}</div>
            <p className="login-hero-subtitle">{hero.subtitle}</p>
          </div>
          <div className="login-hero-cards">
            <div className="hero-card hero-card-orange">
              <div className="hero-card-label">{hero.cards[0]}</div>
              <img
                src="/images/login-kid-1.jpg"
                alt="Student at Gopalan Group of Institutions"
                className="hero-card-img hero-card-img-wide"
              />
            </div>
            <div className="hero-card hero-card-green">
              <div className="hero-card-label">{hero.cards[1]}</div>
              <img
                src="/images/login-kid-2.jpg"
                alt="Parent checking updates from Gopalan Group of Institutions"
                className="hero-card-img"
              />
            </div>
            <div className="hero-card hero-card-blue">
              <div className="hero-card-label">{hero.cards[2]}</div>
              <img
                src="/images/login-kid-3.jpg"
                alt="Teacher managing class at Gopalan Group of Institutions"
                className="hero-card-img"
              />
            </div>
          </div>
        </section>

        <div className="auth-card">
          <div className="brand">
            <span className="dot" />
            <strong>School SAS</strong>
          </div>
          <h1 className="title">Sign In</h1>
          <p className="subtitle">Clean black & white classic UI • One page for all roles</p>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label className="label" htmlFor="role">Role</label>
              <select
                id="role"
                className="input select"
                suppressHydrationWarning
                value={role}
                onChange={(e) => { const r = e.target.value as Role; setRole(r); resetFields(r) }}
              >
                <option value="">Select role ▾</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin / HOD</option>
              </select>
            </div>

            {role === 'student' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="sphone">Phone</label>
                  <input
                    id="sphone"
                    className="input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 9xxxxxxxxx"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="sotp">OTP</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input
                      id="sotp"
                      className="input"
                      value={otp}
                      onChange={e => { setOtp(e.target.value); setOtpVerified(false) }}
                      placeholder="Enter OTP"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
                </div>
                <div className="field">
                  <label className="label" htmlFor="spass">Password</label>
                  <input
                    id="spass"
                    type="password"
                    className="input"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Your student password"
                  />
                </div>
              </>
            )}

            {role === 'parent' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="pphone">Phone</label>
                  <input
                    id="pphone"
                    className="input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 9xxxxxxxxx"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="potp">OTP</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input
                      id="potp"
                      className="input"
                      value={otp}
                      onChange={e => { setOtp(e.target.value); setOtpVerified(false) }}
                      placeholder="Enter OTP"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
                </div>
                <div className="field">
                  <label className="label" htmlFor="ppass">Password</label>
                  <input
                    id="ppass"
                    type="password"
                    className="input"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Your parent password"
                  />
                </div>
              </>
            )}

            {role === 'teacher' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="tname">Teacher Name</label>
                  <input
                    id="tname"
                    className="input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ms. Priya N"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="tphone">Verification Phone</label>
                  <input
                    id="tphone"
                    className="input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 9xxxxxxxxx"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="totp">OTP</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input
                      id="totp"
                      className="input"
                      value={otp}
                      onChange={e => { setOtp(e.target.value); setOtpVerified(false) }}
                      placeholder="Enter OTP"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
                </div>
                <div className="field">
                  <label className="label" htmlFor="tpass">Password</label>
                  <input
                    id="tpass"
                    type="password"
                    className="input"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </>
            )}

            {role === 'accountant' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="accname">Accountant Name</label>
                  <input
                    id="accname"
                    className="input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Accountant Name"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="accpass">Passcode</label>
                  <input
                    id="accpass"
                    type="password"
                    className="input"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </>
            )}

            {role === 'admin' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="aname">HOD / Admin Name</label>
                  <input
                    id="aname"
                    className="input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. HOD Name"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="aphone">Verification Phone</label>
                  <input
                    id="aphone"
                    className="input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 9xxxxxxxxx"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="aotp">OTP</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input
                      id="aotp"
                      className="input"
                      value={otp}
                      onChange={e => { setOtp(e.target.value); setOtpVerified(false) }}
                      placeholder="Enter OTP"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
                </div>
                <div className="field">
                  <label className="label" htmlFor="apass">Passcode</label>
                  <input
                    id="apass"
                    type="password"
                    className="input"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </>
            )}

            {error && <p className="error">{error}</p>}
            <div className="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              {(role === 'student' || role === 'parent') && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    try {
                      window.location.href = '/forgot-password'
                    } catch {}
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {(role === 'student' || role === 'parent' || role === 'teacher' || role === 'admin') && (
              <div className="google-login-row">
                <input
                  className="input google-phone-input"
                  placeholder={
                    role === 'student' || role === 'parent'
                      ? 'Phone number for Google'
                      : 'Name for Google'
                  }
                  value={role === 'student' || role === 'parent' ? phone : name}
                  onChange={e => {
                    if (role === 'student' || role === 'parent') setPhone(e.target.value)
                    else setName(e.target.value)
                  }}
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
            )}
            <p className="signup-note">
              New parent? <a href="/signup">Create parent account</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
