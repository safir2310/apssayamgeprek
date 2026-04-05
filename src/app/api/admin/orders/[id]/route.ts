import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('========================================')
  console.log('PUT /api/admin/orders/[id] CALLED!')
  console.log('========================================')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  
  // Await params in Next.js 15+
  const { id } = await params
  console.log('Resolved params - ID:', id)
  
  try {
    console.log('Step 1: Parsing request body...')
    const body = await request.json()
    console.log('Step 1 COMPLETE - Request body:', body)
    
    const { status, paymentStatus, paymentMethod } = body
    console.log('Extracted values - status:', status, 'paymentStatus:', paymentStatus, 'paymentMethod:', paymentMethod)

    if (!status && !paymentStatus && !paymentMethod) {
      console.error('Step 2 FAILED - No valid field to update')
      return NextResponse.json(
        { error: 'At least status, paymentStatus, or paymentMethod is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.log('Step 2 COMPLETE - Validation passed')

    // Check if order exists first
    console.log('Step 3: Checking if order exists...')
    const existingOrder = await prisma.order.findUnique({
      where: { id: id }
    })

    if (!existingOrder) {
      console.error('Step 3 FAILED - Order not found:', id)
      return NextResponse.json(
        { error: 'Order not found', orderId: id },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.log('Step 3 COMPLETE - Order found:', existingOrder.orderNumber)

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (paymentMethod) updateData.paymentMethod = paymentMethod

    console.log('Step 4: Updating order with data:', updateData)

    const order = await prisma.order.update({
      where: { id: id },
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

    console.log('Step 4 COMPLETE - Order updated successfully:', order.orderNumber)

    const response = {
      success: true,
      data: order,
      message: 'Order updated successfully'
    }
    console.log('Step 5: Returning response:', response)
    
    const nextResponse = NextResponse.json(response, { headers: { 'Content-Type': 'application/json' } })
    console.log('Step 5 COMPLETE - NextResponse created')
    
    return nextResponse
  } catch (error: any) {
    console.error('========================================')
    console.error('CATCH BLOCK - Error updating order:')
    console.error('========================================')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    const errorResponse = {
      error: 'Failed to update order',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
    console.log('Returning error response:', errorResponse)
    
    return NextResponse.json(errorResponse, { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

// DELETE - Cancel/Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: id }
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
      where: { id: id },
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
