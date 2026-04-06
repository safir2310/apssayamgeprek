import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payment-methods - Get all active payment methods
export async function GET() {
  try {
    const paymentMethods = await db.paymentMethod.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      },
      select: {
        code: true,
        name: true,
        icon: true
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
