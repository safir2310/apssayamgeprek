import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the response to match the frontend expectations
    const transformedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.image,
      price: p.price,
      stock: p.stock,
      category: p.category.name,
      categoryId: p.categoryId,
      barcode: p.barcode,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, image, price, cost, stock, categoryId, barcode, isActive } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: 'Name, price, and categoryId are required' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        image,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        stock: stock || 0,
        categoryId,
        barcode: barcode || null,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
