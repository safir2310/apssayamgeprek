import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/dashboard/recent-orders - Get recent orders and transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent transactions
    const transactions = await db.transaction.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        cashier: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Get recent orders
    const orders = await db.order.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform transactions
    const transformedTransactions = transactions.map(t => ({
      id: t.id,
      orderNumber: t.transactionNumber,
      type: 'POS',
      customerName: t.cashier.name,
      totalAmount: t.finalAmount,
      status: t.status,
      paymentStatus: t.paymentStatus,
      paymentMethod: t.paymentMethod,
      createdAt: t.createdAt,
      itemCount: t.items.length
    }))

    // Transform orders
    const transformedOrders = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: 'ONLINE',
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      itemCount: o.items.length
    }))

    // Combine and sort by date
    const recentOrders = [...transformedTransactions, ...transformedOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json(recentOrders)
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent orders' },
      { status: 500 }
    )
  }
}
