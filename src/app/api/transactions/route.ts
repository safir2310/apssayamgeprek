import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      items,
      totalAmount,
      paymentMethod,
      paidAmount,
      cashierId,
      shiftId,
      memberId,
      discount = 0
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    if (!totalAmount || !paymentMethod || !cashierId || !shiftId) {
      return NextResponse.json(
        { error: 'Missing required fields: totalAmount, paymentMethod, cashierId, shiftId' },
        { status: 400 }
      )
    }

    // Generate transaction number
    const transactionNumber = `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Calculate final amount
    const finalAmount = totalAmount - discount

    // Start transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create main transaction
      const newTransaction = await tx.transaction.create({
        data: {
          transactionNumber,
          cashierId,
          shiftId,
          totalAmount,
          discount,
          finalAmount,
          paymentMethod,
          paymentStatus: 'PAID',
          status: 'COMPLETED'
        }
      })

      // Create transaction items
      for (const item of items) {
        await tx.transactionItem.create({
          data: {
            transactionId: newTransaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          }
        })

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        // Create stock log
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reference: newTransaction.id,
            notes: `Transaction ${transactionNumber}`
          }
        })
      }

      // Create payment record
      await tx.payment.create({
        data: {
          transactionId: newTransaction.id,
          amount: paidAmount || finalAmount,
          method: paymentMethod,
          status: 'COMPLETED'
        }
      })

      // If member exists, add points (1 point per 1000 spent)
      if (memberId) {
        const pointsEarned = Math.floor(finalAmount / 1000)
        if (pointsEarned > 0) {
          await tx.member.update({
            where: { id: memberId },
            data: {
              points: {
                increment: pointsEarned
              }
            }
          })

          // Create point history
          await tx.pointHistory.create({
            data: {
              memberId,
              type: 'EARN',
              points: pointsEarned,
              reference: newTransaction.id,
              description: `Transaction ${transactionNumber}`
            }
          })
        }
      }

      return newTransaction
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        totalAmount: transaction.totalAmount,
        discount: transaction.discount,
        finalAmount: transaction.finalAmount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (shiftId) {
      where.shiftId = shiftId
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      where.createdAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        shift: {
          select: {
            id: true,
            openedAt: true,
            closedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      success: true,
      transactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
