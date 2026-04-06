import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Validate voucher code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const cartTotal = parseFloat(searchParams.get('cartTotal') || '0')

    if (!code) {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      )
    }

    // Find the promo/voucher by code
    const promo = await prisma.promo.findUnique({
      where: {
        code: code.toUpperCase()
      }
    })

    if (!promo) {
      return NextResponse.json({
        valid: false,
        error: 'Kode voucher tidak valid'
      })
    }

    // Check if promo is active
    if (!promo.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'Kode voucher tidak aktif'
      })
    }

    // Check if promo is within valid date range
    const now = new Date()
    if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
      return NextResponse.json({
        valid: false,
        error: 'Kode voucher telah kadaluarsa'
      })
    }

    // Check minimum purchase requirement
    if (promo.minPurchase && cartTotal < promo.minPurchase) {
      return NextResponse.json({
        valid: false,
        error: `Minimal pembayaran Rp${promo.minPurchase.toLocaleString('id-ID')}`
      })
    }

    let discountAmount = 0
    let freeProductId = null
    let freeProductName = null

    // Calculate discount or get free product based on type
    if (promo.type === 'PERCENTAGE') {
      discountAmount = (cartTotal * promo.value) / 100
      // Apply max discount limit if exists
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount
      }
    } else if (promo.type === 'FIXED') {
      discountAmount = promo.value
      // Ensure discount doesn't exceed cart total
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal
      }
    } else if (promo.type === 'FREE_PRODUCT' && promo.productId) {
      // Get the free product details
      const product = await prisma.product.findUnique({
        where: { id: promo.productId },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true
        }
      })

      if (!product || !product.isActive || product.stock < 1) {
        return NextResponse.json({
          valid: false,
          error: 'Produk gratis tidak tersedia atau habis'
        })
      }

      freeProductId = product.id
      freeProductName = product.name
      discountAmount = 0 // No discount, it's a free product
    } else if (promo.type === 'BOGO') {
      // BOGO: Buy One Get One - discount equals the product price
      if (promo.productId) {
        const product = await prisma.product.findUnique({
          where: { id: promo.productId },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true
          }
        })

        if (!product || !product.isActive || product.stock < 1) {
          return NextResponse.json({
            valid: false,
            error: 'Produk BOGO tidak tersedia atau habis'
          })
        }

        freeProductId = product.id
        freeProductName = product.name
        discountAmount = product.price
      }
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: promo.value,
        discountAmount,
        freeProductId,
        freeProductName
      }
    })
  } catch (error) {
    console.error('Error validating voucher:', error)
    return NextResponse.json(
      { error: 'Failed to validate voucher' },
      { status: 500 }
    )
  }
}
