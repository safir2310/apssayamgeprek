import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all cashiers with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [cashiers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              transactions: true,
              cashierShifts: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: cashiers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching cashiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cashiers' },
      { status: 500 }
    )
  }
}

// POST - Create new cashier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, pin, roleId } = body

    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: 'Name, email, password, and roleId are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    const cashier = await prisma.user.create({
      data: {
        name,
        email,
        password,
        phone: phone || null,
        pin: pin || null,
        roleId
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Remove password from response
    const { password: _, ...cashierWithoutPassword } = cashier as any

    return NextResponse.json({
      success: true,
      data: cashierWithoutPassword
    })
  } catch (error) {
    console.error('Error creating cashier:', error)
    return NextResponse.json(
      { error: 'Failed to create cashier' },
      { status: 500 }
    )
  }
}
