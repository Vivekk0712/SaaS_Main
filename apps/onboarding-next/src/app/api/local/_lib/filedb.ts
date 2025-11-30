import fs from 'fs'
import path from 'path'

type Parent = { phone: string; parentName: string; password: string; createdAt: string }
type Application = { id: string; parentPhone: string; data: any; status: string; createdAt: string; confirmedAt?: string }
type Installment = { label?: string; dueDate: string; amount: number }
type Fee = { appId: string; items: Array<{ label: string; amount: number }>; total: number; installments?: Installment[]; updatedAt: string }
type ParentProfile = { phone: string; parentName: string; password: string }
type StudentProfile = { name: string; fatherPhone: string; grade: string; section?: string; roll?: string; photoDataUrl?: string; password?: string }
export type LocalDB = { parents: Parent[]; applications: Application[]; fees: Fee[]; profiles?: { parents: ParentProfile[]; students: StudentProfile[] } }

const DB_PATH = path.resolve(process.cwd(), '../../data/local-db.json')
const EMPTY = { parents: [], applications: [], fees: [], profiles: { parents: [], students: [] } }

function ensureFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2))
  }
}

export function readDB(): LocalDB {
  ensureFile()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const db = JSON.parse(raw || '{}') as LocalDB
    if (!('profiles' in db)) (db as any).profiles = { parents: [], students: [] }
    return db
  } catch {
    return { ...EMPTY }
  }
}

export function writeDB(db: LocalDB) {
  ensureFile()
  const tmp = DB_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_PATH)
}

export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function resetDB() {
  ensureFile()
  const tmp = DB_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(EMPTY, null, 2))
  fs.renameSync(tmp, DB_PATH)
}
