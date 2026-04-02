import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/dashboard/top-products - Get top selling products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get all transaction items with their transactions
    const transactionItems = await db.transactionItem.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        },
        transaction: true
      }
    })

    // Get all order items with their orders
    const orderItems = await db.orderItem.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        },
        order: true
      }
    })

    // Combine and aggregate product sales
    const productSales = new Map<string, any>()

    // Process transaction items
    for (const item of transactionItems) {
      if (item.transaction.status === 'COMPLETED' && item.transaction.paymentStatus === 'PAID') {
        const productId = item.product.id
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category.name,
            totalQuantity: 0,
            totalRevenue: 0
          })
        }
        const data = productSales.get(productId)
        data.totalQuantity += item.quantity
        data.totalRevenue += item.subtotal
      }
    }

    // Process order items
    for (const item of orderItems) {
      if (item.order.status === 'COMPLETED' && item.order.paymentStatus === 'PAID') {
        const productId = item.product.id
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category.name,
            totalQuantity: 0,
            totalRevenue: 0
          })
        }
        const data = productSales.get(productId)
        data.totalQuantity += item.quantity
        data.totalRevenue += item.subtotal
      }
    }

    // Convert to array and sort by total quantity
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)

    return NextResponse.json(topProducts)
  } catch (error) {
    console.error('Error fetching top products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top products' },
      { status: 500 }
    )
  }
}
