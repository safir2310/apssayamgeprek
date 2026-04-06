import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    // Default to today's date
    const targetDate = dateParam
      ? new Date(dateParam)
      : new Date()

    // Set start and end of day
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Fetch transactions for the day
    const transactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'COMPLETED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        cashier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate metrics
    const totalSales = transactions.reduce((sum, t) => sum + (t.finalAmount || t.totalAmount), 0)
    const totalTransactions = transactions.length
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Sales by payment method
    const salesByMethod = {
      CASH: 0,
      QRIS: 0,
      DEBIT: 0,
      TRANSFER: 0,
      E_WALLET: 0,
      SPLIT: 0
    }

    transactions.forEach(transaction => {
      const method = transaction.paymentMethod as keyof typeof salesByMethod
      if (salesByMethod[method] !== undefined) {
        salesByMethod[method] += transaction.finalAmount || transaction.totalAmount
      }
    })

    // Top products by quantity sold
    const productSales = new Map<string, { name: string; quantity: number; amount: number }>()

    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const key = item.productId
        const existing = productSales.get(key) || { name: item.product.name, quantity: 0, amount: 0 }
        existing.quantity += item.quantity
        existing.amount += item.subtotal
        productSales.set(key, existing)
      })
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Hourly sales distribution
    const hourlySales = new Array(24).fill(0)
    transactions.forEach(transaction => {
      const hour = transaction.createdAt.getHours()
      hourlySales[hour] += transaction.finalAmount || transaction.totalAmount
    })

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      summary: {
        totalSales,
        totalTransactions,
        averageTransaction,
        salesByMethod
      },
      transactions,
      topProducts,
      hourlySales
    })
  } catch (error) {
    console.error('Error fetching daily sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
