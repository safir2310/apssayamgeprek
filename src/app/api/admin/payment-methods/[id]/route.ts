import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentMethodId } = await params
    const body = await request.json()
    const { code, name, description, icon, isActive, sortOrder } = body

    // If code is being updated, check if it already exists (excluding current method)
    if (code !== undefined && code !== null) {
      const existingMethod = await prisma.paymentMethod.findFirst({
        where: {
          code,
          NOT: { id: paymentMethodId }
        }
      })

      if (existingMethod) {
        return NextResponse.json(
          { error: 'Payment method code already exists' },
          { status: 400 }
        )
      }
    }

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    })

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

// DELETE - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentMethodId } = await params
    // Check if payment method is used in any transaction or order
    const [transactionCount, orderCount] = await Promise.all([
      prisma.transaction.count({
        where: { paymentMethod: { equals: paymentMethodId } }
      }),
      prisma.order.count({
        where: { paymentMethod: { equals: paymentMethodId } }
      })
    ])

    if (transactionCount > 0 || orderCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment method that is in use' },
        { status: 400 }
      )
    }

    await prisma.paymentMethod.delete({
      where: { id: paymentMethodId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
