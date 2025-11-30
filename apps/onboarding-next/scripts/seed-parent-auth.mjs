// Seed auth_users entries for all parents with default password '12345'
// and ensure 'parent' role bindings.

import mysql from 'mysql2/promise'
import crypto from 'node:crypto'

function connOptionsFromEnv() {
  const url = process.env.DATABASE_URL || ''
  const socket = process.env.DB_SOCKET || ''
  if (socket) {
    return {
      socketPath: socket,
      user: process.env.DB_USER || 'sas_app',
      password: process.env.DB_PASSWORD || 'sas_strong_password_123',
      database: process.env.DB_NAME || 'sas',
      charset: 'utf8mb4_general_ci'
    }
  }
  if (url) return { uri: url }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sas_app',
    password: process.env.DB_PASSWORD || 'sas_strong_password_123',
    database: process.env.DB_NAME || 'sas',
    charset: 'utf8mb4_general_ci'
  }
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input), 'utf8').digest('hex')
}

async function main() {
  const db = await mysql.createPool({ ...(connOptionsFromEnv()), connectionLimit: 10 })
  const [parents] = await db.query('SELECT id, name, phone FROM parents')
  if (!parents.length) { console.log('No parents found. Seed parents first.'); process.exit(0) }

  // Ensure parent role
  let [[role]] = await db.query('SELECT id FROM auth_roles WHERE name="parent" LIMIT 1')
  if (!role) {
    const [res] = await db.execute('INSERT INTO auth_roles (name) VALUES ("parent")')
    role = { id: res.insertId }
  }
  const hex = sha256Hex('12345')

  for (const p of parents) {
    const email = String(p.phone)
    let [[u]] = await db.query('SELECT id FROM auth_users WHERE email=? LIMIT 1', [email])
    if (!u) {
      const [res] = await db.execute('INSERT INTO auth_users (email, password_hash, display_name, status) VALUES (?, UNHEX(?), ?, "active")', [email, hex, p.name || email])
      u = { id: res.insertId }
    } else {
      await db.execute('UPDATE auth_users SET display_name=? WHERE id=?', [p.name || email, u.id])
    }
    await db.execute('INSERT IGNORE INTO auth_role_bindings (user_id, role_id) VALUES (?, ?)', [u.id, role.id])
  }

  console.log(`Seeded auth for ${parents.length} parents with password 12345`)
  await db.end()
}

main().catch((err) => { console.error('Seed parent auth error:', err); process.exitCode = 1 })
