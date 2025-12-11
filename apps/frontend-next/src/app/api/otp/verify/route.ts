import { NextResponse } from 'next/server'

type OtpEntry = { code: string; expiresAt: number }
const OTP_TTL_MS = 5 * 60 * 1000

function getStore(): Map<string, OtpEntry> {
  const g = globalThis as any
  if (!g.__sasOtpStore) {
    g.__sasOtpStore = new Map<string, OtpEntry>()
  }
  return g.__sasOtpStore as Map<string, OtpEntry>
}

function normalize(phone: string): string {
  return phone.replace(/\s+/g, '')
}

export async function POST(req: Request) {
  const { phone, code } = await req.json().catch(() => ({} as any))
  if (!phone || !code || typeof phone !== 'string' || typeof code !== 'string') {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const store = getStore()
  const key = normalize(phone)
  const entry = store.get(key)
  if (!entry) {
    return NextResponse.json(
      { ok: false, error: 'invalid_or_expired_otp' },
      { status: 400 }
    )
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return NextResponse.json(
      { ok: false, error: 'invalid_or_expired_otp' },
      { status: 400 }
    )
  }

  if (entry.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'invalid_or_expired_otp' },
      { status: 400 }
    )
  }

  store.delete(key)
  return NextResponse.json({ ok: true })
}
