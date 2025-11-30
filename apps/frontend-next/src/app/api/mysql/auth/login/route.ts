import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '../../../_lib/db'

type UserRow = {
  id: number
  email: string
  password_hash: Buffer
  display_name: string
  status: 'active' | 'disabled'
  roles: string // comma-joined
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'missing_credentials' }, { status: 400 })
    }
    const rows = await query<UserRow>(
      `SELECT u.id, u.email, u.password_hash, u.display_name, u.status,
              GROUP_CONCAT(r.name) AS roles
         FROM auth_users u
         LEFT JOIN auth_role_bindings rb ON rb.user_id = u.id
         LEFT JOIN auth_roles r ON r.id = rb.role_id
        WHERE u.email = ?
        GROUP BY u.id`,
      [email]
    )
    if (!rows.length) return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 })
    const u = rows[0]
    if (u.status !== 'active') return NextResponse.json({ ok: false, error: 'user_disabled' }, { status: 403 })

    // For first cut, expect password_hash to store sha256 hex in VARBINARY
    const provided = sha256Hex(String(password))
    const stored = Buffer.isBuffer(u.password_hash) ? u.password_hash.toString('hex') : String(u.password_hash || '')
    if (provided !== stored) return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 })

    const roles = String(u.roles || '').split(',').map(s => s.trim()).filter(Boolean)
    if (role && roles.length && !roles.includes(role)) {
      return NextResponse.json({ ok: false, error: 'role_not_permitted' }, { status: 403 })
    }

    // Set minimal session payload in a HttpOnly cookie (demo). In production use JWT.
    const payload = { id: u.id, email: u.email, name: u.display_name, roles }
    const cookie = `sas_session=${encodeURIComponent(JSON.stringify(payload))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    return new NextResponse(JSON.stringify({ ok: true, user: payload }), {
      status: 200,
      headers: { 'set-cookie': cookie, 'content-type': 'application/json' }
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}


