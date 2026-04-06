import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all payment methods
export async function GET(request: NextRequest) {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, description, icon, isActive = true, sortOrder = 0 } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { code }
    })

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Payment method code already exists' },
        { status: 400 }
      )
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        code,
        name,
        description: description || null,
        icon: icon || null,
        isActive,
        sortOrder
      }
    })

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}
