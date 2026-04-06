import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
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
      isActive = true
    } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: 'Name, price, and categoryId are required' },
        { status: 400 }
      )
    }

    // Check if barcode is unique
    if (barcode) {
      const existingProduct = await prisma.product.findUnique({
        where: { barcode }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Barcode already exists' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        barcode: barcode || null,
        description: description || null,
        image: image || null,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        stock: parseInt(stock) || 0,
        categoryId,
        isActive
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

    // Create stock log for initial stock
    if (stock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: parseInt(stock),
          reference: 'INITIAL_STOCK',
          notes: 'Initial stock when creating product'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
