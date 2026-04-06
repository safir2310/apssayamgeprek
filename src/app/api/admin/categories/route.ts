import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProductCount = searchParams.get('includeProductCount') === 'true'

    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      },
      ...(includeProductCount && {
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name
      }
    })

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
