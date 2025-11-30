import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { query, exec } from '../../_lib/db'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function POST(req: Request) {
  const { phone, parentName, password } = await req.json().catch(() => ({}))
  if (!phone || !parentName || !password) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  // Ensure parent exists
  const parent = await query<{ id: number }>('SELECT id FROM parents WHERE phone=? LIMIT 1', [phone])
  if (!parent.length) {
    await exec('INSERT INTO parents (name, phone, email) VALUES (?, ?, NULL)', [parentName, phone])
  }
  // Ensure auth user (email field will keep the phone for simplicity)
  const users = await query<{ id: number }>('SELECT id FROM auth_users WHERE email=? LIMIT 1', [phone])
  const pwdHex = sha256Hex(String(password))
  let userId: number
  if (!users.length) {
    await exec('INSERT INTO auth_users (email, password_hash, display_name, status) VALUES (?, UNHEX(?), ?, "active")', [phone, pwdHex, parentName])
    const ins = await query<any>('SELECT LAST_INSERT_ID() AS id')
    userId = Number((ins[0] as any).id)
  } else {
    userId = users[0].id
    await exec('UPDATE auth_users SET display_name=?, password_hash=UNHEX(?) WHERE id=?', [parentName, pwdHex, userId])
  }
  // Ensure parent role and binding
  const roles = await query<{ id: number }>('SELECT id FROM auth_roles WHERE name="parent"')
  let roleId = roles.length ? roles[0].id : 0
  if (!roleId) {
    await exec('INSERT INTO auth_roles (name) VALUES ("parent")')
    const r = await query<any>('SELECT LAST_INSERT_ID() AS id')
    roleId = Number((r[0] as any).id)
  }
  await exec('INSERT IGNORE INTO auth_role_bindings (user_id, role_id) VALUES (?, ?)', [userId, roleId])
  return NextResponse.json({ ok: true, next: 'login' })
}
