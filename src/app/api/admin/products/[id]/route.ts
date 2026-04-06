import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      barcode,
      description,
      image,
      price,
      cost,
      stock,
      categoryId,
      isActive
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if barcode is unique (if changed)
    if (barcode && barcode !== existingProduct.barcode) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { barcode }
      })

      if (duplicateProduct) {
        return NextResponse.json(
          { error: 'Barcode already exists' },
          { status: 400 }
        )
      }
    }

    // Calculate stock difference for logging
    const stockDifference = stock !== undefined ? parseInt(stock) - existingProduct.stock : 0

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(description !== undefined && { description: description || null }),
        ...(image !== undefined && { image: image || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(cost !== undefined && { cost: cost ? parseFloat(cost) : null }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create stock log if stock changed
    if (stockDifference !== 0 && stock !== undefined) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          type: stockDifference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(stockDifference),
          reference: 'STOCK_ADJUSTMENT',
          notes: `Stock adjusted from ${existingProduct.stock} to ${stock}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            orderItems: true,
            transactions: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has been used in orders or transactions
    if (product._count.orderItems > 0 || product._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has been used in orders or transactions' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
