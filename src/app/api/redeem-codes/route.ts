import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Validate a redeem code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    const redeemCode = await prisma.redeemCode.findUnique({
      where: { code },
      include: {
        pointExchangeProduct: true
      }
    })

    if (!redeemCode) {
      return NextResponse.json({ error: 'Kode redeem tidak valid' }, { status: 404 })
    }

    // Check if code is already used
    if (redeemCode.isUsed) {
      return NextResponse.json({ error: 'Kode redeem sudah digunakan' }, { status: 400 })
    }

    // Check if code is expired
    if (new Date() > redeemCode.expiresAt) {
      return NextResponse.json({ error: 'Kode redeem sudah kadaluarsa' }, { status: 400 })
    }

    // Return valid code info
    return NextResponse.json({
      valid: true,
      code: redeemCode.code,
      productName: redeemCode.pointExchangeProduct.name,
      type: redeemCode.pointExchangeProduct.type,
      value: redeemCode.pointExchangeProduct.value,
      productId: redeemCode.pointExchangeProduct.productId
    })
  } catch (error) {
    console.error('Error validating redeem code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
