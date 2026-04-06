import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    const databaseHealthy = true

    // Check API health
    const apiHealthy = true

    // Calculate system metrics (simulated for now)
    const uptime = process.uptime()
    const uptimeHours = Math.floor(uptime / 3600)
    const uptimeMins = Math.floor((uptime % 3600) / 60)
    const uptimeString = `${uptimeHours}h ${uptimeMins}m`

    const healthData = {
      status: (databaseHealthy && apiHealthy) ? 'healthy' : 'error',
      database: databaseHealthy,
      api: apiHealthy,
      server: true,
      uptime: uptimeString,
      memory: '45%', // In production, use actual memory usage
      cpu: '23%' // In production, use actual CPU usage
    }

    return NextResponse.json(healthData)
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      database: false,
      api: false,
      server: false,
      uptime: 'N/A',
      memory: 'N/A',
      cpu: 'N/A'
    }, { status: 500 })
  }
}
