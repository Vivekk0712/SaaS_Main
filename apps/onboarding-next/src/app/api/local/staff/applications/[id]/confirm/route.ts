import { NextResponse } from 'next/server'
import { exec } from '../../../../../_lib/db'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await exec('UPDATE applications SET status="admissions_confirmed" WHERE id=?', [Number(params.id)])
  return NextResponse.json({ ok: true })
}
