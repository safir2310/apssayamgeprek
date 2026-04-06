import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all promos
export async function GET(request: NextRequest) {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: promos
    })
  } catch (error) {
    console.error('Error fetching promos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promos' },
      { status: 500 }
    )
  }
}

// POST - Create new promo
export async function POST(request: NextRequest) {
  try {
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
      isActive = true
    } = body

    if (!code || !name || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Code, name, type, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingPromo = await prisma.promo.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existingPromo) {
      return NextResponse.json(
        { error: 'Kode promo sudah ada' },
        { status: 400 }
      )
    }

    const promo = await prisma.promo.create({
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
        type,
        value: value || 0,
        minPurchase: minPurchase || null,
        maxDiscount: maxDiscount || null,
        productId: (type === 'FREE_PRODUCT' || type === 'BOGO') ? productId : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: promo
    })
  } catch (error) {
    console.error('Error creating promo:', error)
    return NextResponse.json(
      { error: 'Failed to create promo' },
      { status: 500 }
    )
  }
}
