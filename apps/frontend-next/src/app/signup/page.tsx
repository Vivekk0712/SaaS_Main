"use client"
import React from "react"
import { useRouter } from "next/navigation"

export default function ParentSignupPage() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [phoneOtp, setPhoneOtp] = React.useState("")
  const [phoneOtpVerified, setPhoneOtpVerified] = React.useState(false)
  const [phoneOtpSending, setPhoneOtpSending] = React.useState(false)

  const [email, setEmail] = React.useState("")
  const [emailOtp, setEmailOtp] = React.useState("")
  const [emailOtpVerified, setEmailOtpVerified] = React.useState(false)

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [created, setCreated] = React.useState(false)

  const sendPhoneOtp = async () => {
    setMessage("")
    const ph = phone.trim()
    if (!ph) {
      setMessage("Enter phone number to receive OTP")
      return
    }
    try {
      setPhoneOtpSending(true)
      const r = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: ph }),
      })
      if (!r.ok) {
        setMessage("Could not send OTP. Please try again.")
        return
      }
      setMessage("OTP sent to your phone.")
      setPhoneOtpVerified(false)
    } catch {
      setMessage("Could not send OTP. Please try again.")
    } finally {
      setPhoneOtpSending(false)
    }
  }

  const verifyPhoneOtp = async () => {
    setMessage("")
    const ph = phone.trim()
    const code = phoneOtp.trim()
    if (!ph || !code) {
      setMessage("Enter phone and OTP before verifying")
      return
    }
    try {
      const r = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: ph, code }),
      })
      if (!r.ok) {
        setMessage("Invalid or expired OTP. Please try again.")
        setPhoneOtpVerified(false)
        return
      }
      setPhoneOtpVerified(true)
    } catch {
      setMessage("Could not verify OTP. Please try again.")
      setPhoneOtpVerified(false)
    }
  }

  const verifyEmailOtp = () => {
    // For now, treat any non-empty OTP as verified (email OTP backend can be wired later).
    if (!email.trim() || !emailOtp.trim()) {
      setMessage("Enter email and email OTP")
      return
    }
    setEmailOtpVerified(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage("Enter all required fields")
      return
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }
    if (!phoneOtpVerified) {
      setMessage("Please verify phone OTP")
      return
    }
    // Email OTP is optional for now; if filled, require verification.
    if (email.trim() && !emailOtpVerified) {
      setMessage("Please verify email OTP or clear the email field")
      return
    }

    try {
      setLoading(true)
      const r = await fetch("/api/local/parent/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          password,
        }),
      })
      if (!r.ok) {
        setMessage("Could not create account. Please try again.")
        return
      }
      setCreated(true)
      setMessage("Account created. You can now log in.")
    } catch {
      setMessage("Could not create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="container login-shell">
        <div className="auth-card">
          <div className="brand">
            <span className="dot" />
            <strong>School SAS</strong>
          </div>
          <h1 className="title">Parent account created</h1>
          <p className="subtitle">
            You can now log in with your phone and password or continue to the admissions form.
          </p>
          <div className="actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn"
              type="button"
              onClick={() => router.push("/")}
            >
              Login to Dashboard
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "http://localhost:3020/"
                }
              }}
            >
              Fill Application Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container login-shell">
      <div className="auth-card">
        <div className="brand">
          <span className="dot" />
          <strong>School SAS</strong>
        </div>
        <h1 className="title">Parent Sign Up</h1>
        <p className="subtitle">
          Create your parent account with phone OTP and a password. You can use the same login for dashboard and admissions.
        </p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label" htmlFor="su-name">Parent Name</label>
            <input
              id="su-name"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ananya Gupta"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="su-phone">Phone Number</label>
            <input
              id="su-phone"
              className="input"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneOtpVerified(false) }}
              placeholder="e.g. +91 9xxxxxxxxx"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="su-phone-otp">Phone OTP</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input
                id="su-phone-otp"
                className="input"
                value={phoneOtp}
                onChange={e => { setPhoneOtp(e.target.value); setPhoneOtpVerified(false) }}
                placeholder="Enter OTP"
              />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="button"
                onClick={sendPhoneOtp}
                disabled={phoneOtpSending}
              >
                {phoneOtpSending ? "Sending…" : "Send OTP"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={verifyPhoneOtp}
              >
                Verify OTP
              </button>
              {phoneOtpVerified && (
                <span
                  style={{
                    color: "#16a34a",
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    animation: "otp-pop 0.25s ease-out",
                  }}
                >
                  <span>✓</span>
                  <span>Verified</span>
                </span>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="su-email">Email (optional)</label>
            <input
              id="su-email"
              className="input"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailOtpVerified(false) }}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="su-email-otp">Email OTP (optional)</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input
                id="su-email-otp"
                className="input"
                value={emailOtp}
                onChange={e => { setEmailOtp(e.target.value); setEmailOtpVerified(false) }}
                placeholder="Enter email OTP (dev placeholder)"
              />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="button secondary"
                onClick={verifyEmailOtp}
              >
                Verify Email OTP
              </button>
              {email.trim() && emailOtpVerified && (
                <span
                  style={{
                    color: "#16a34a",
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    animation: "otp-pop 0.25s ease-out",
                  }}
                >
                  <span>✓</span>
                  <span>Email verified</span>
                </span>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="su-pass">New Password</label>
            <input
              id="su-pass"
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a password"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="su-pass2">Confirm Password</label>
            <input
              id="su-pass2"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>

          {message && (
            <p className="signup-message" style={{ marginTop: 8 }}>
              {message}
            </p>
          )}

          <div className="actions" style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Account"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => router.push("/")}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
