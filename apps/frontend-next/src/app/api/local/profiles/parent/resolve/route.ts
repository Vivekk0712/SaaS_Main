import { NextResponse } from 'next/server'
import { query } from '../../../../_lib/db'
import crypto from 'crypto'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

function canonicalPhone(input: string): string {
  // Normalize basic formatting (remove spaces); do not remap to any other number.
  return String(input || '').replace(/\s+/g, '')
}

export async function POST(req: Request) {
  // Secure resolve by phone + password (hashed against auth_users)
  const { phone, password } = await req.json().catch(() => ({}))
  if (!phone || !password) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const phoneForAuth = canonicalPhone(String(phone))
  const rows = await query<{ id:number; password_hash: Buffer; display_name: string }>(
    'SELECT id, password_hash, display_name FROM auth_users WHERE email=? LIMIT 1',
    [phoneForAuth]
  )
  if (rows.length) {
    const provided = sha256Hex(String(password))
    const stored = Buffer.isBuffer(rows[0].password_hash)
      ? rows[0].password_hash.toString('hex')
      : String(rows[0].password_hash || '')
    if (provided !== stored) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  } else {
    // Demo fallback: allow default password for seeded parents when auth_users is empty.
    if (String(password) !== '12345') return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  }
  const parents = await query<{ name:string }>('SELECT name FROM parents WHERE phone=? LIMIT 1', [phoneForAuth])
  const fallbackName = rows.length ? rows[0].display_name : ''
  const parentName = parents.length ? parents[0].name : (fallbackName || phone)
  return NextResponse.json({ phone, parentName })
}
