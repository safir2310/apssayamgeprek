import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT - Update promo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoId } = await params
    const body = await request.json()
    const {
      code,
      name,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      productId,
      startDate,
      endDate,
      isActive
    } = body

    // If code is being updated, check if it already exists (excluding current promo)
    if (code !== undefined && code !== null) {
      const existingPromo = await prisma.promo.findFirst({
        where: {
          code: code.toUpperCase(),
          NOT: { id: promoId }
        }
      })

      if (existingPromo) {
        return NextResponse.json(
          { error: 'Kode promo sudah ada' },
          { status: 400 }
        )
      }
    }

    const promo = await prisma.promo.update({
      where: { id: promoId },
      data: {
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value }),
        ...(minPurchase !== undefined && { minPurchase }),
        ...(maxDiscount !== undefined && { maxDiscount }),
        ...(type !== undefined && productId !== undefined && { productId: (type === 'FREE_PRODUCT' || type === 'BOGO') ? productId : null }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({
      success: true,
      data: promo
    })
  } catch (error) {
    console.error('Error updating promo:', error)
    return NextResponse.json(
      { error: 'Failed to update promo' },
      { status: 500 }
    )
  }
}

// DELETE - Delete promo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoId } = await params

    await prisma.promo.delete({
      where: { id: promoId }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting promo:', error)
    return NextResponse.json(
      { error: 'Failed to delete promo' },
      { status: 500 }
    )
  }
}
