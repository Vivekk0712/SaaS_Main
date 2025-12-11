import { NextResponse } from 'next/server'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromWhatsApp =
  process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
const toWhatsApp = process.env.TWILIO_WHATSAPP_LOGIN_TO

export async function POST() {
  if (!accountSid || !authToken || !fromWhatsApp || !toWhatsApp) {
    return NextResponse.json(
      { error: 'twilio_not_configured' },
      { status: 500 }
    )
  }

  try {
    const body = new URLSearchParams({
      From: fromWhatsApp,
      To: toWhatsApp,
      Body: 'Hi, you have successfully logged in to School SAS.',
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
        { error: 'twilio_whatsapp_failed', detail: text.slice(0, 300) },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'twilio_whatsapp_error' }, { status: 500 })
  }
}

