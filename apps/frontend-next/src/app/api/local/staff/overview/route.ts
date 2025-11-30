import { NextResponse } from 'next/server'
import { readDB } from '../../_lib/filedb'

export async function GET() {
  const db = readDB()
  const totalApps = db.applications.length
  // Submitted means total applications received
  const submitted = totalApps
  // Admissions Confirmed means application approved by admissions (remains counted even after fees are set)
  const confirmed = db.applications.filter(a => a.status === 'admissions_confirmed' || a.status === 'fees_set').length
  const feesSet = db.applications.filter(a => a.status === 'fees_set').length
  return NextResponse.json({ totalApps, submitted, confirmed, feesSet })
}
