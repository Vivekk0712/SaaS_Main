import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { exec } from '../../../_lib/db'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function POST(req: Request) {
  const { name, phone, email, password } = await req.json().catch(() => ({}))

  if (!name || !phone || !password) {
    return NextResponse.json(
      { error: 'missing_fields' },
      { status: 400 },
    )
  }

  const trimmedName = String(name).trim()
  const trimmedPhone = String(phone).replace(/\s+/g, '')
  const trimmedEmail = email ? String(email).trim() : null
  const hex = sha256Hex(String(password))

  try {
    // Upsert auth user (login by phone as email)
    await exec(
      `INSERT INTO auth_users (email, password_hash, display_name)
       VALUES (?, UNHEX(?), ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         display_name = VALUES(display_name)`,
      [trimmedPhone, hex, trimmedName],
    )

    // Upsert parent profile
    await exec(
      `INSERT INTO parents (name, phone, email)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         email = VALUES(email)`,
      [trimmedName, trimmedPhone, trimmedEmail],
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'signup_failed' },
      { status: 500 },
    )
  }
}

