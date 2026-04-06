import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logToDevServer } from '@/lib/logger'

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')

    logToDevServer('GET /api/orders - Fetching orders', { status, paymentStatus })

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

    logToDevServer('GET /api/orders - Success', { count: orders.length })
    return NextResponse.json(orders)
  } catch (error) {
    logToDevServer('GET /api/orders - Error', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  logToDevServer('=== POST /api/orders START ===')

  try {
    logToDevServer('Parsing request body...')
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      logToDevServer('Error parsing request body', parseError)
      const textBody = await request.text()
      logToDevServer('Request body as text', { length: textBody.length })
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      )
    }

    const { customerName, customerPhone, customerAddress, notes, totalAmount, discount, redeemCode, paymentMethod, items } = body

    logToDevServer('Received order request', {
      customerName,
      customerPhone,
      customerAddress,
      totalAmount,
      discount,
      itemsCount: items?.length
    })

    if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
      logToDevServer('Validation failed', { customerName, customerPhone, customerAddress, itemsLength: items?.length })
      return NextResponse.json(
        { error: 'Customer information and items are required' },
        { status: 400 }
      )
    }

    // Validate that all products exist
    logToDevServer('Validating products...', items.map((i: any) => i.productId))
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        logToDevServer('Product not found', { productId: item.productId })
        return NextResponse.json(
          { error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 400 }
        )
      }

      if (!product.isActive) {
        logToDevServer('Product not active', { productId: item.productId, name: product.name })
        return NextResponse.json(
          { error: `Produk ${product.name} tidak aktif` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        logToDevServer('Insufficient stock', {
          productId: item.productId,
          name: product.name,
          needed: item.quantity,
          available: product.stock
        })
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

    logToDevServer('Creating order', { orderNumber, itemCount: items.length })

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

    logToDevServer('Order created successfully', { id: order.id, orderNumber: order.orderNumber })

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
        logToDevServer('Error updating stock', { productId: item.productId, error })
        // Continue with other products even if one fails
      }
    }

    // Add points to member if they exist (1 point per Rp 1.000)
    logToDevServer('Checking for member...', { customerPhone })
    try {
      const member = await db.member.findUnique({
        where: { phone: customerPhone }
      })

      if (member) {
        const pointsToAdd = Math.floor((totalAmount || calculatedTotal) / 1000)
        if (pointsToAdd > 0) {
          const newPoints = member.points + pointsToAdd
          await db.member.update({
            where: { id: member.id },
            data: { points: newPoints }
          })
          logToDevServer('Points added to member', {
            memberId: member.id,
            memberName: member.name,
            pointsToAdd,
            oldPoints: member.points,
            newPoints
          })
        }
      }
    } catch (error) {
      logToDevServer('Error adding points to member', error)
      // Don't fail the order if points addition fails
    }

    logToDevServer('=== POST /api/orders SUCCESS ===')
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    logToDevServer('=== POST /api/orders ERROR ===', error)
    if (error instanceof Error) {
      logToDevServer('Error details', { message: error.message })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
