import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/dashboard/sales-chart - Get sales chart data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily' // daily, weekly, monthly

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    let chartData: any[] = []

    if (period === 'daily') {
      // Last 7 days
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo)
        date.setDate(date.getDate() + i)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        nextDate.setHours(0, 0, 0, 0)

        const transactions = await db.transaction.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            },
            status: 'COMPLETED',
            paymentStatus: 'PAID'
          }
        })

        const orders = await db.order.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            },
            status: 'COMPLETED',
            paymentStatus: 'PAID'
          }
        })

        const sales = transactions.reduce((sum, t) => sum + t.finalAmount, 0) +
                     orders.reduce((sum, o) => sum + o.totalAmount, 0)

        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

        chartData.push({
          name: dayNames[date.getDay()],
          date: date.toISOString().split('T')[0],
          sales
        })
      }
    } else if (period === 'weekly') {
      // Last 4 weeks
      const fourWeeksAgo = new Date(today)
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(fourWeeksAgo)
        weekStart.setDate(weekStart.getDate() + (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const transactions = await db.transaction.findMany({
          where: {
            createdAt: {
              gte: weekStart,
              lt: weekEnd
            },
            status: 'COMPLETED',
            paymentStatus: 'PAID'
          }
        })

        const orders = await db.order.findMany({
          where: {
            createdAt: {
              gte: weekStart,
              lt: weekEnd
            },
            status: 'COMPLETED',
            paymentStatus: 'PAID'
          }
        })

        const sales = transactions.reduce((sum, t) => sum + t.finalAmount, 0) +
                     orders.reduce((sum, o) => sum + o.totalAmount, 0)

        chartData.push({
          name: `Minggu ${i + 1}`,
          week: i + 1,
          sales
        })
      }
    } else if (period === 'monthly') {
      // Last 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1)

        const transactions = await db.transaction.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextMonth
            },
            status: 'COMPLETED',
            paymentStatus: 'PAID'
          }
        })

        const orders = await db.order.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextMonth
            },
            status: 'COMPLETED',
            paymentStatus: 'PAID'
          }
        })

        const sales = transactions.reduce((sum, t) => sum + t.finalAmount, 0) +
                     orders.reduce((sum, o) => sum + o.totalAmount, 0)

        chartData.push({
          name: monthNames[date.getMonth()],
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          sales
        })
      }
    }

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching sales chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales chart data' },
      { status: 500 }
    )
  }
}
