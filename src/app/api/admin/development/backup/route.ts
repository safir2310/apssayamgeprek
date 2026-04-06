import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Get all data from database
    const [users, roles, products, categories, orders, transactions, members] = await Promise.all([
      prisma.user.findMany(),
      prisma.role.findMany(),
      prisma.product.findMany(),
      prisma.category.findMany(),
      prisma.order.findMany(),
      prisma.transaction.findMany(),
      prisma.member.findMany()
    ])

    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        roles,
        products,
        categories,
        orders,
        transactions,
        members
      }
    }

    // Save backup to file
    const backupId = `backup-${Date.now()}`
    const backupPath = join(process.cwd(), 'backups', `${backupId}.json`)

    // Create backups directory if it doesn't exist
    const { mkdir } = require('fs/promises')
    const { dirname } = require('path')
    await mkdir(dirname(backupPath), { recursive: true })

    await writeFile(backupPath, JSON.stringify(backupData, null, 2))

    return NextResponse.json({
      success: true,
      backupId,
      message: 'Backup created successfully'
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create backup'
    }, { status: 500 })
  }
}
