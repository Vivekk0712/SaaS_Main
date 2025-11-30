import fs from 'fs'
import path from 'path'

type Parent = { phone: string; parentName: string; password: string; createdAt: string }
type Application = { id: string; parentPhone: string; data: any; status: string; createdAt: string; confirmedAt?: string }
type Fee = { appId: string; items: Array<{ label: string; amount: number }>; total: number; updatedAt: string }
type AdhocTarget =
  | { type: 'student'; studentName?: string; parentPhone?: string }
  | { type: 'class'; grade: string }
  | { type: 'section'; grade: string; section: string }
  | { type: 'classes'; grades: string[] }
type AdhocFee = { id: string; title: string; purpose?: string; items: Array<{ label: string; amount: number }>; total: number; target?: AdhocTarget; createdAt: string }
type ParentProfile = { phone: string; parentName: string; password: string }
type StudentProfile = { name: string; fatherPhone: string; grade: string; section?: string; roll?: string; photoDataUrl?: string; password?: string }
type Meta = { version: number; updatedAt: string }
type MarkSheet = { test: string; subject: string; klass: string; section: string; date?: string; max: number; marks: Record<string, number>; createdBy?: string; ts?: number }
export type LocalDB = {
  parents: Parent[]
  applications: Application[]
  fees: Fee[]
  adhocFees?: AdhocFee[]
  profiles?: { parents: ParentProfile[]; students: StudentProfile[] }
  attendance?: Record<string, Record<string, boolean>> // key -> map(usn->present)
  marks?: MarkSheet[]
  diary?: Record<string, any[]> // date -> DiaryEntry[]
  circulars?: any[]
  calendar?: Record<string, any[]>
  meta?: Meta
  adhocBills?: Array<{ id: string; adhocId: string; appId: string; parentPhone: string; name: string; title: string; items: Array<{label:string;amount:number}>; total: number; createdAt: string; status?: 'unpaid'|'paid' }>
  academics?: {
    subjects?: string[]
    classSubjects?: Record<string, string[]> // key: `${klass}|${section}`
    syllabus?: Record<string, any> // key: `${klass}|${section}|${subject.toLowerCase()}` -> { chapters: [...] }
    textbooks?: Record<string, any[]>
    materials?: Record<string, any[]>
    pyqs?: Record<string, any[]>
  }
}

const DB_PATH = path.resolve(process.cwd(), '../../data/local-db.json')

function ensureFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify({ parents: [], applications: [], fees: [], adhocFees: [], profiles: { parents: [], students: [] }, attendance: {}, marks: [], diary: {}, circulars: [], calendar: {}, meta: { version: 0, updatedAt: new Date().toISOString() } }, null, 2))
  }
}

export function readDB(): LocalDB {
  ensureFile()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const db = JSON.parse(raw || '{}') as LocalDB
    if (!('profiles' in db)) (db as any).profiles = { parents: [], students: [] }
    if (!('adhocFees' in db)) (db as any).adhocFees = []
    if (!('attendance' in db)) (db as any).attendance = {}
    if (!('marks' in db)) (db as any).marks = []
    if (!('diary' in db)) (db as any).diary = {}
    if (!('circulars' in db)) (db as any).circulars = []
    if (!('calendar' in db)) (db as any).calendar = {}
    if (!('meta' in db)) (db as any).meta = { version: 0, updatedAt: new Date().toISOString() }
    if (!('adhocBills' in db)) (db as any).adhocBills = []
    if (!('academics' in db)) (db as any).academics = { subjects: [], classSubjects: {}, syllabus: {}, textbooks: {}, materials: {}, pyqs: {} }
    return db
  } catch {
    return { parents: [], applications: [], fees: [], adhocFees: [], profiles: { parents: [], students: [] }, attendance: {}, marks: [], diary: {}, circulars: [], calendar: {}, meta: { version: 0, updatedAt: new Date().toISOString() }, adhocBills: [], academics: { subjects: [], classSubjects: {}, syllabus: {}, textbooks: {}, materials: {}, pyqs: {} } }
  }
}

export function writeDB(db: LocalDB) {
  ensureFile()
  // bump version atomically
  try {
    const rawPrev = fs.readFileSync(DB_PATH, 'utf8')
    const cur = JSON.parse(rawPrev || '{}') as LocalDB
    const prevV = (cur as any)?.meta?.version || 0
    ;(db as any).meta = { version: prevV + 1, updatedAt: new Date().toISOString() }
  } catch {
    ;(db as any).meta = { version: ((db as any)?.meta?.version || 0) + 1, updatedAt: new Date().toISOString() }
  }
  const tmp = DB_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_PATH)
}
