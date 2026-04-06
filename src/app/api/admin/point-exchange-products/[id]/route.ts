import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT - Update point exchange product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const body = await request.json()
    const { name, description, image, points, type, value, productId: inputProductId, stock, isActive } = body

    // Validate required fields
    if (!name || !points || !type) {
      return NextResponse.json(
        { error: 'Nama, points, dan type harus diisi' },
        { status: 400 }
      )
    }

    // Validate type and value
    if (type === 'DISCOUNT_FIXED' || type === 'DISCOUNT_PERCENT') {
      if (!value || value <= 0) {
        return NextResponse.json(
          { error: 'Value harus diisi dan lebih dari 0 untuk tipe diskon' },
          { status: 400 }
        )
      }
    }

    if (type === 'FREE_PRODUCT' && !inputProductId) {
      return NextResponse.json(
        { error: 'Product ID harus diisi untuk tipe free product' },
        { status: 400 }
      )
    }

    const product = await prisma.pointExchangeProduct.update({
      where: { id: productId },
      data: {
        name,
        description: description || null,
        image: image || null,
        points: parseInt(points),
        type,
        value: value ? parseFloat(value) : null,
        productId: inputProductId || null,
        stock: stock ? parseInt(stock) : 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating point exchange product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete point exchange product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    // Check if product has unused redeem codes
    const product = await prisma.pointExchangeProduct.findUnique({
      where: { id: productId },
      include: { redeemCodes: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const hasUnusedCodes = product.redeemCodes.some(code => !code.isUsed)

    if (hasUnusedCodes) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus produk yang memiliki kode redeem yang belum digunakan' },
        { status: 400 }
      )
    }

    await prisma.pointExchangeProduct.delete({
      where: { id: productId }
    })

    return NextResponse.json({ message: 'Produk berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting point exchange product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
