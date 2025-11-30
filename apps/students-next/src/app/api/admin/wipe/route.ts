import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), '../../data/local-db.json')
const EMPTY = { parents: [], applications: [], fees: [], profiles: { parents: [], students: [] } }

export async function DELETE() {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    const tmp = DB_PATH + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(EMPTY, null, 2))
    fs.renameSync(tmp, DB_PATH)
  } catch {}
  return NextResponse.json({ ok: true, wiped: true })
}

