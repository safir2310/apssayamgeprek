import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all void logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [voidLogs, total] = await Promise.all([
      prisma.voidLog.findMany({
        where,
        include: {
          transaction: {
            select: {
              id: true,
              transactionNumber: true,
              totalAmount: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.voidLog.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: voidLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching void logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch void logs' },
      { status: 500 }
    )
  }
}
