import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

const CONFIG_FILE = join(process.cwd(), 'app-config.json')

export async function PUT(request: NextRequest) {
  try {
    const config = await request.json()

    // Save configuration
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update configuration'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Read configuration
    const configData = await readFile(CONFIG_FILE, 'utf-8').catch(() => null)

    if (!configData) {
      // Return default config if file doesn't exist
      return NextResponse.json({
        maintenanceMode: false,
        debugMode: false,
        apiRateLimit: true,
        cacheEnabled: true,
        notificationsEnabled: true,
        autoBackup: true
      })
    }

    const config = JSON.parse(configData)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error reading config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to read configuration'
    }, { status: 500 })
  }
}
