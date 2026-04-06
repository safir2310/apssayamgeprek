import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all members with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.member.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST - Create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address, isActive = true } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingMember = await prisma.member.findUnique({
      where: { phone }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        points: 0,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: member
    })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
