import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logToDevServer } from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    logToDevServer('PUT /api/orders/[id]/confirm - Confirming payment', { orderId })

    // Check if order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update order status and payment status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'PAID'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    logToDevServer('Payment confirmed successfully', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    logToDevServer('Error confirming payment', error)
    return NextResponse.json(
      { error: 'Gagal mengkonfirmasi pembayaran' },
      { status: 500 }
    )
  }
}
