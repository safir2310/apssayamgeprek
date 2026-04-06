import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// POST - Exchange points for a redeem code
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, pointExchangeProductId } = body

    // Validate required fields
    if (!memberId || !pointExchangeProductId) {
      return NextResponse.json(
        { error: 'Member ID dan Product ID harus diisi' },
        { status: 400 }
      )
    }

    // Fetch member and product in parallel
    const [member, product] = await Promise.all([
      prisma.member.findUnique({
        where: { id: memberId }
      }),
      prisma.pointExchangeProduct.findUnique({
        where: { id: pointExchangeProductId }
      })
    ])

    // Validate member
    if (!member) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })
    }

    // Validate product
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Check if product is active
    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Produk tidak aktif' },
        { status: 400 }
      )
    }

    // Check if member has enough points
    if (member.points < product.points) {
      return NextResponse.json(
        { error: `Poin tidak cukup. Diperlukan ${product.points} poin` },
        { status: 400 }
      )
    }

    // Check stock
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: 'Stok produk habis' },
        { status: 400 }
      )
    }

    // Generate unique redeem code (8 character alphanumeric)
    const generateRedeemCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = 'REDEEM-'
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    let redeemCode = generateRedeemCode()

    // Ensure code is unique
    let codeExists = await prisma.redeemCode.findUnique({
      where: { code: redeemCode }
    })
    while (codeExists) {
      redeemCode = generateRedeemCode()
      codeExists = await prisma.redeemCode.findUnique({
        where: { code: redeemCode }
      })
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create redeem code, deduct points, create point history, and reduce stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create redeem code
      const newRedeemCode = await tx.redeemCode.create({
        data: {
          code: redeemCode,
          pointExchangeProductId,
          memberId,
          expiresAt
        }
      })

      // Deduct points from member
      await tx.member.update({
        where: { id: memberId },
        data: {
          points: {
            decrement: product.points
          }
        }
      })

      // Create point history
      await tx.pointHistory.create({
        data: {
          memberId,
          type: 'REDEEM',
          points: -product.points,
          reference: newRedeemCode.id,
          description: `Menukar ${product.points} poin untuk ${product.name}`
        }
      })

      // Reduce product stock
      await tx.pointExchangeProduct.update({
        where: { id: pointExchangeProductId },
        data: {
          stock: {
            decrement: 1
          }
        }
      })

      return { redeemCode: newRedeemCode }
    })

    return NextResponse.json({
      redeemCode: result.redeemCode.code,
      productName: product.name,
      pointsUsed: product.points,
      expiresAt: result.redeemCode.expiresAt
    })
  } catch (error) {
    console.error('Error exchanging points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
