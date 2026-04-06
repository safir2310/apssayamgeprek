import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const LOGS_FILE = join(process.cwd(), 'system-logs.json')

export async function GET(request: NextRequest) {
  try {
    // Read logs from file
    const logsData = await readFile(LOGS_FILE, 'utf-8').catch(() => null)

    if (!logsData) {
      return NextResponse.json({
        logs: [
          'Sistem dimulai',
          'Database terhubung',
          'API server berjalan',
          'Semua sistem berjalan normal'
        ]
      })
    }

    const logs = JSON.parse(logsData)
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error reading logs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to read logs'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { log } = await request.json()

    // Read existing logs
    const logsData = await readFile(LOGS_FILE, 'utf-8').catch(() => '[]')
    const logs = JSON.parse(logsData)

    // Add new log
    const timestamp = new Date().toISOString()
    logs.unshift(`[${timestamp}] ${log}`)

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.length = 100
    }

    // Save logs
    await writeFile(LOGS_FILE, JSON.stringify(logs, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Log added successfully'
    })
  } catch (error) {
    console.error('Error adding log:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add log'
    }, { status: 500 })
  }
}
