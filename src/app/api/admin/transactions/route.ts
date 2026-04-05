import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all transactions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const cashierId = searchParams.get('cashierId')
    const shiftId = searchParams.get('shiftId')

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (cashierId) {
      where.cashierId = cashierId
    }

    if (shiftId) {
      where.shiftId = shiftId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          },
          payments: true,
          cashier: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          shift: {
            select: {
              id: true,
              openedAt: true,
              closedAt: true
            }
          },
          voidLogs: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
