import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../_lib/filedb'

export async function POST() {
  // Reset the shared local DB to a clean state for fresh testing
  const now = new Date().toISOString()
  const empty = {
    parents: [],
    applications: [],
    fees: [],
    adhocFees: [],
    profiles: { parents: [], students: [] },
    attendance: {},
    marks: [],
    diary: {},
    circulars: [],
    calendar: {},
    adhocBills: [],
    academics: { subjects: [], classSubjects: {}, syllabus: {}, textbooks: {}, materials: {}, pyqs: {} },
    meta: { version: 0, updatedAt: now },
  }
  try {
    // Touch the file to ensure directory exists
    readDB()
  } catch {}
  writeDB(empty as any)
  return NextResponse.json({ ok: true })
}

