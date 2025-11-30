import { NextResponse } from 'next/server'

type OtpSession = {
  phone: string
  role: string
  code: string
  expiresAt: number
  used: boolean
}

declare const global: {
  otpSessions?: Map<string, OtpSession>
} & typeof globalThis

const store: Map<string, OtpSession> = (global.otpSessions = global.otpSessions || new Map())

export async function POST(req: Request) {
  try {
    const { otpToken, otp } = await req.json()
    if (!otpToken || !otp) {
      return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 })
    }

    const session = store.get(String(otpToken))
    if (!session) {
      return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 })
    }
    if (session.used) {
      return NextResponse.json({ ok: false, error: 'already_used' }, { status: 400 })
    }
    if (session.expiresAt < Date.now()) {
      store.delete(String(otpToken))
      return NextResponse.json({ ok: false, error: 'expired' }, { status: 400 })
    }
    if (String(otp).trim() !== session.code) {
      return NextResponse.json({ ok: false, error: 'invalid_otp' }, { status: 400 })
    }

    session.used = true
    store.set(String(otpToken), session)

    return NextResponse.json({ ok: true, phone: session.phone, role: session.role })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

