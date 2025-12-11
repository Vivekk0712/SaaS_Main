"use client"
import React from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [newPass, setNewPass] = React.useState("")
  const [confirmPass, setConfirmPass] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [otpSending, setOtpSending] = React.useState(false)
  const [otpSent, setOtpSent] = React.useState(false)

  const sendOtp = async () => {
    setMessage("")
    if (!phone) {
      setMessage("Enter phone number to receive OTP")
      return
    }
    try {
      setOtpSending(true)
      const resp = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      if (!resp.ok) {
        setMessage("Could not send OTP. Please try again.")
        return
      }
      setOtpSent(true)
      setMessage("OTP sent to your phone number.")
    } catch {
      setMessage("Could not send OTP. Please try again.")
    } finally {
      setOtpSending(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    if (!phone || !otp || !newPass || !confirmPass) {
      setMessage("Enter phone, OTP and both password fields")
      return
    }
    if (newPass !== confirmPass) {
      setMessage("Passwords do not match")
      return
    }
    try {
      setLoading(true)

      // Verify OTP via Twilio Verify
      const verifyResp = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      })
      if (!verifyResp.ok) {
        setMessage("Invalid or expired OTP. Please try again.")
        return
      }

      // Reset passwords for student and parent linked to this phone.
      // Ignore not_found errors so it works for either role.
      await fetch("/api/local/profiles/student/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fatherPhone: phone, newPassword: newPass }),
      }).catch(() => {})

      await fetch("/api/local/profiles/parent/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, newPassword: newPass }),
      }).catch(() => {})

      setMessage("Password updated successfully. You can now sign in with the new password.")
      setOtp("")
      setNewPass("")
      setConfirmPass("")
    } catch {
      setMessage("Could not reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container login-shell">
      <div className="auth-card">
        <div className="brand">
          <span className="dot" />
          <strong>School SAS</strong>
        </div>
        <h1 className="title">Forgot Password</h1>
        <p className="subtitle">
          Reset your login using your registered phone number. We will verify with an OTP sent via SMS.
        </p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label" htmlFor="fp-phone">Phone Number</label>
            <input
              id="fp-phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9xxxxxxxxx"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="fp-otp">OTP</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="fp-otp"
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
              <button
                type="button"
                className="button"
                style={{ whiteSpace: "nowrap" }}
                onClick={sendOtp}
                disabled={otpSending}
              >
                {otpSending ? "Sendingƒ?İ" : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="fp-new">New Password</label>
            <input
              id="fp-new"
              type="password"
              className="input"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="fp-confirm">Confirm New Password</label>
            <input
              id="fp-confirm"
              type="password"
              className="input"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          {message && <p className="note" style={{ marginTop: 8 }}>{message}</p>}

          <div className="actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update Password"}
            </button>
            <button
              className="btn-ghost"
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
