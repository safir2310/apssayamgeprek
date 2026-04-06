import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Mark redeem code as used
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, orderId } = body

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    // Find and update the redeem code
    const redeemCode = await prisma.redeemCode.findUnique({
      where: { code }
    })

    if (!redeemCode) {
      return NextResponse.json({ error: 'Kode redeem tidak ditemukan' }, { status: 404 })
    }

    if (redeemCode.isUsed) {
      return NextResponse.json({ error: 'Kode redeem sudah digunakan' }, { status: 400 })
    }

    // Mark as used
    const updated = await prisma.redeemCode.update({
      where: { code },
      data: {
        isUsed: true,
        usedInOrderId: orderId || null,
        usedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Kode redeem berhasil ditandai sebagai digunakan', updated })
  } catch (error) {
    console.error('Error marking redeem code as used:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
