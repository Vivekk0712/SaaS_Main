import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { exec } from '../../../../_lib/db'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function POST(req: Request) {
  const { phone, newPassword } = await req.json().catch(() => ({}))
  if (!phone || !newPassword) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const hex = sha256Hex(String(newPassword))
  await exec('UPDATE auth_users SET password_hash=UNHEX(?) WHERE email=?', [hex, phone])
  return NextResponse.json({ ok: true })
}
