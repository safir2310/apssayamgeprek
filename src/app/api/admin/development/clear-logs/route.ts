import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

const LOGS_FILE = join(process.cwd(), 'system-logs.json')

export async function POST(request: NextRequest) {
  try {
    // Clear logs by writing empty array
    await writeFile(LOGS_FILE, JSON.stringify([], null, 2))

    return NextResponse.json({
      success: true,
      message: 'Logs cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing logs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear logs'
    }, { status: 500 })
  }
}
