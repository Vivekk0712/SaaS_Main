import { NextResponse } from 'next/server'
import crypto from 'crypto'

type OtpSession = {
  phone: string
  role: string
  code: string
  expiresAt: number
  used: boolean
}

const otpSessions = new Map<string, OtpSession>()

export async function POST(req: Request) {
  try {
    const { phone, role } = await req.json()
    if (!phone || !role) {
      return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 })
    }

    const otpToken = crypto.randomBytes(16).toString('hex')
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 5 * 60 * 1000

    otpSessions.set(otpToken, {
      phone: String(phone),
      role: String(role),
      code,
      expiresAt,
      used: false
    })

    console.log('[otp:start]', { phone, role, code })

    return NextResponse.json({ ok: true, otpToken })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

