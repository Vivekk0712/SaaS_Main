import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '../../_lib/db'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function POST(req: Request) {
  const { phone, password } = await req.json().catch(() => ({}))
  if (!phone || !password) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const rows = await query<{ id:number; status:'active'|'disabled'; password_hash: Buffer }>(
    'SELECT id, status, password_hash FROM auth_users WHERE email=? LIMIT 1', [phone]
  )
  if (!rows.length) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  const u = rows[0]
  if (u.status !== 'active') return NextResponse.json({ error: 'user_disabled' }, { status: 403 })
  const provided = sha256Hex(String(password))
  const stored = Buffer.isBuffer(u.password_hash) ? u.password_hash.toString('hex') : String(u.password_hash || '')
  if (provided !== stored) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
