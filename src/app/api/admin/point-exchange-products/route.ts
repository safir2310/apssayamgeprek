import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all point exchange products
export async function GET() {
  try {
    const products = await prisma.pointExchangeProduct.findMany({
      include: {
        _count: {
          select: {
            redeemCodes: {
              where: {
                isUsed: false,
                expiresAt: {
                  gt: new Date()
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(products.map(product => ({
      ...product,
      availableRedeemCodes: product._count.redeemCodes
    })))
  } catch (error) {
    console.error('Error fetching point exchange products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new point exchange product
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, image, points, type, value, productId, stock, isActive } = body

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

    if (type === 'FREE_PRODUCT' && !productId) {
      return NextResponse.json(
        { error: 'Product ID harus diisi untuk tipe free product' },
        { status: 400 }
      )
    }

    const product = await prisma.pointExchangeProduct.create({
      data: {
        name,
        description: description || null,
        image: image || null,
        points: parseInt(points),
        type,
        value: value ? parseFloat(value) : null,
        productId: productId || null,
        stock: stock ? parseInt(stock) : 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating point exchange product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
