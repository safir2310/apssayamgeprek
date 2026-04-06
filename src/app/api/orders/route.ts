import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')

    const where: any = {}
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus

    const orders = await db.order.findMany({
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerPhone, customerAddress, notes, totalAmount, discount, redeemCode, paymentMethod, items } = body

    console.log('Received order request:', { customerName, customerPhone, customerAddress, totalAmount, discount, items })

    if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
      console.log('Validation failed:', { customerName, customerPhone, customerAddress, itemsLength: items?.length })
      return NextResponse.json(
        { error: 'Customer information and items are required' },
        { status: 400 }
      )
    }

    // Validate that all products exist
    console.log('Validating products...', items.map(i => i.productId))
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        console.error(`Product not found: ${item.productId}`)
        return NextResponse.json(
          { error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 400 }
        )
      }

      if (!product.isActive) {
        console.error(`Product not active: ${item.productId}`)
        return NextResponse.json(
          { error: `Produk ${product.name} tidak aktif` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        console.error(`Insufficient stock for product ${item.productId}: needed ${item.quantity}, available ${product.stock}`)
        return NextResponse.json(
          { error: `Stok tidak cukup untuk ${product.name}. Tersedia: ${product.stock}, Diminta: ${item.quantity}` },
          { status: 400 }
        )
      }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Calculate total amount if not provided
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

    console.log('Creating order with items:', items)

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerAddress,
        notes: notes || null,
        totalAmount: totalAmount || calculatedTotal,
        discount: discount || 0,
        redeemCode: redeemCode || null,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal || (item.price * item.quantity)
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    console.log('Order created successfully:', order.id)

    // Update product stock
    for (const item of items) {
      try {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        // Create stock log
        await db.stockLog.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reference: order.id,
            notes: `Order #${orderNumber}`
          }
        })
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error)
        // Continue with other products even if one fails
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
