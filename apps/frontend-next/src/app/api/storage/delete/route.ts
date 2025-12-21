import { NextRequest, NextResponse } from 'next/server'
import { deleteFromB2 } from '@/lib/backblaze'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
})

export async function POST(request: NextRequest) {
  try {
    const { b2Key } = await request.json()

    if (!b2Key || typeof b2Key !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid b2Key' },
        { status: 400 }
      )
    }

    // Delete from B2 storage
    const b2Result = await deleteFromB2(b2Key)
    
    if (!b2Result.success) {
      console.error('Failed to delete from B2:', b2Result.error)
      return NextResponse.json(
        { error: 'Failed to delete from storage', details: b2Result.error },
        { status: 500 }
      )
    }

    // Delete from MySQL database (materials table)
    const connection = await pool.getConnection()
    try {
      await connection.execute(
        'DELETE FROM materials WHERE b2_key = ?',
        [b2Key]
      )
      
      // Also delete from textbooks table if exists
      await connection.execute(
        'DELETE FROM textbooks WHERE b2_key = ?',
        [b2Key]
      )
    } finally {
      connection.release()
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted from storage and database'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
