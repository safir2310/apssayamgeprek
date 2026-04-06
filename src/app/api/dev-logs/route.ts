import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const logFile = path.join(process.cwd(), 'dev.log')
    const logContent = fs.readFileSync(logFile, 'utf-8')
    const lines = logContent.split('\n').filter(line => line.trim())

    // Get last 100 lines
    const recentLogs = lines.slice(-100)

    return NextResponse.json({
      logs: recentLogs,
      totalLines: lines.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
