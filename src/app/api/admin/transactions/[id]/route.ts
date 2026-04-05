import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true
              }
            }
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
            closedAt: true,
            openingBalance: true,
            closingBalance: true
          }
        },
        voidLogs: {
          include: {
            approvedByUser: {
              select: {
                id: true,
                name: true
              }
            },
            createdByUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: transaction
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

// POST - Void transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { reason, approvedBy } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        items: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status === 'VOID') {
      return NextResponse.json(
        { error: 'Transaction is already voided' },
        { status: 400 }
      )
    }

    // Void the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        status: 'VOID'
      }
    })

    // Create void log
    await prisma.voidLog.create({
      data: {
        transactionId: params.id,
        type: 'TRANSACTION',
        reason,
        approvedBy: approvedBy || null,
        amount: transaction.finalAmount
      }
    })

    // Restore stock for all items
    for (const item of transaction.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      })

      // Create stock log
      await prisma.stockLog.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reference: params.id,
          notes: `Stock restored from voided transaction ${transaction.transactionNumber}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction voided successfully'
    })
  } catch (error) {
    console.error('Error voiding transaction:', error)
    return NextResponse.json(
      { error: 'Failed to void transaction' },
      { status: 500 }
    )
  }
}
