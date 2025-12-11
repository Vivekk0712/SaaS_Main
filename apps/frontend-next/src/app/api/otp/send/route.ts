import { NextResponse } from 'next/server'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER

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
  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: 'twilio_not_configured' },
      { status: 500 }
    )
  }

  const { phone } = await req.json().catch(() => ({} as any))
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
  }

  const normalized = normalize(phone)
  const store = getStore()
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = Date.now() + OTP_TTL_MS
  store.set(normalized, { code, expiresAt })
  const trialTo =
    process.env.TWILIO_TRIAL_TO && typeof process.env.TWILIO_TRIAL_TO === 'string'
      ? normalize(process.env.TWILIO_TRIAL_TO)
      : normalized

  try {
    const body = new URLSearchParams({
      To: trialTo,
      From: fromNumber,
      Body: `Your School SAS OTP is ${code}. It is valid for 5 minutes.`,
    })

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return NextResponse.json(
        { error: 'twilio_send_failed', detail: text.slice(0, 300) },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'twilio_error' }, { status: 500 })
  }
}
