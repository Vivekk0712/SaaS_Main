import { NextResponse } from 'next/server'
import { readDB } from '../../local/_lib/filedb'

export async function GET() {
    const db = readDB()
    return NextResponse.json({
        adhocFeesCount: (db.adhocFees || []).length,
        adhocBillsCount: (db.adhocBills || []).length,
        adhocFees: db.adhocFees || [],
        adhocBills: db.adhocBills || [],
    })
}
