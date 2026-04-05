import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/admin/orders/[id] - params:', params.id)
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { status, paymentStatus, paymentMethod } = body

    if (!status && !paymentStatus && !paymentMethod) {
      console.error('No valid field to update')
      return NextResponse.json(
        { error: 'At least status, paymentStatus, or paymentMethod is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if order exists first
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      console.error('Order not found:', params.id)
      return NextResponse.json(
        { error: 'Order not found', orderId: params.id },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (paymentMethod) updateData.paymentMethod = paymentMethod

    console.log('Updating order with data:', updateData)

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
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
      }
    })

    console.log('Order updated successfully:', order.orderNumber)

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    }, { headers: { 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE - Cancel/Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow cancelling pending or processing orders
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel order that is already completed or cancelled' },
        { status: 400 }
      )
    }

    await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'FAILED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
