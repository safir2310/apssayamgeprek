import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfWeek = new Date(today)
    const dayOfWeek = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust when day is Sunday
    startOfWeek.setDate(diff)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Today's sales (from transactions and orders)
    const todayTransactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: today
        },
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    })

    const todayOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: today
        },
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    })

    const todaySales = todayTransactions.reduce((sum, t) => sum + t.finalAmount, 0) +
                      todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Weekly sales
    const weeklyTransactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfWeek
        },
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    })

    const weeklyOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: startOfWeek
        },
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    })

    const weeklySales = weeklyTransactions.reduce((sum, t) => sum + t.finalAmount, 0) +
                       weeklyOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Monthly sales
    const monthlyTransactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfMonth
        },
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    })

    const monthlyOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth
        },
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    })

    const monthlySales = monthlyTransactions.reduce((sum, t) => sum + t.finalAmount, 0) +
                        monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Total orders
    const totalTransactions = await db.transaction.count({
      where: {
        status: 'COMPLETED'
      }
    })

    const totalOrders = await db.order.count({
      where: {
        status: 'COMPLETED'
      }
    })

    const totalOrdersCount = totalTransactions + totalOrders

    // Total products
    const totalProducts = await db.product.count({
      where: {
        isActive: true
      }
    })

    // Active members
    const activeMembers = await db.member.count({
      where: {
        isActive: true
      }
    })

    return NextResponse.json({
      todaySales,
      weeklySales,
      monthlySales,
      totalOrders: totalOrdersCount,
      totalProducts,
      activeMembers
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
