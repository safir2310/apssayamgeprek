import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cashierId, openingBalance, shiftId, physicalBalance } = body

    if (action === 'open') {
      // Open a new shift
      if (!cashierId) {
        return NextResponse.json(
          { error: 'cashierId is required' },
          { status: 400 }
        )
      }

      // Check if there's an open shift for this cashier
      const existingOpenShift = await prisma.cashierShift.findFirst({
        where: {
          cashierId,
          isOpen: true
        },
        select: {
          id: true,
          cashierId: true,
          openingBalance: true,
          isOpen: true,
          openedAt: true
        }
      })

      if (existingOpenShift) {
        return NextResponse.json(
          {
            error: 'Cashier already has an open shift',
            shift: {
              ...existingOpenShift,
              openedAt: existingOpenShift.openedAt.toISOString()
            }
          },
          { status: 400 }
        )
      }

      const shift = await prisma.cashierShift.create({
        data: {
          cashierId,
          openingBalance: openingBalance || 0,
          totalSales: 0,
          totalCash: 0,
          totalNonCash: 0,
          systemBalance: openingBalance || 0,
          isOpen: true,
          openedAt: new Date()
        },
        select: {
          id: true,
          cashierId: true,
          openingBalance: true,
          isOpen: true,
          openedAt: true
        }
      })

      return NextResponse.json({
        success: true,
        shift: {
          ...shift,
          openedAt: shift.openedAt.toISOString()
        }
      })
    }

    if (action === 'close') {
      // Close a shift
      if (!shiftId) {
        return NextResponse.json(
          { error: 'shiftId is required' },
          { status: 400 }
        )
      }

      const shift = await prisma.cashierShift.findUnique({
        where: { id: shiftId },
        include: {
          transactions: {
            where: {
              status: 'COMPLETED'
            },
            select: {
              finalAmount: true,
              paymentMethod: true
            }
          }
        }
      })

      if (!shift) {
        return NextResponse.json(
          { error: 'Shift not found' },
          { status: 404 }
        )
      }

      if (!shift.isOpen) {
        return NextResponse.json(
          { error: 'Shift is already closed' },
          { status: 400 }
        )
      }

      // Calculate totals
      const totalSales = shift.transactions.reduce((sum, trx) => sum + trx.finalAmount, 0)
      const totalCash = shift.transactions
        .filter(trx => trx.paymentMethod === 'CASH')
        .reduce((sum, trx) => sum + trx.finalAmount, 0)
      const totalNonCash = shift.transactions
        .filter(trx => trx.paymentMethod !== 'CASH')
        .reduce((sum, trx) => sum + trx.finalAmount, 0)

      const systemBalance = shift.openingBalance + totalSales

      // Calculate difference
      const difference = physicalBalance ? physicalBalance - systemBalance : 0

      // Update shift
      const updatedShift = await prisma.cashierShift.update({
        where: { id: shiftId },
        data: {
          closingBalance: physicalBalance || systemBalance,
          totalSales,
          totalCash,
          totalNonCash,
          systemBalance,
          physicalBalance,
          difference,
          isOpen: false,
          closedAt: new Date()
        },
        select: {
          id: true,
          cashierId: true,
          openingBalance: true,
          closingBalance: true,
          totalSales: true,
          totalCash: true,
          totalNonCash: true,
          systemBalance: true,
          physicalBalance: true,
          difference: true,
          isOpen: true,
          openedAt: true,
          closedAt: true
        }
      })

      return NextResponse.json({
        success: true,
        shift: {
          ...updatedShift,
          openedAt: updatedShift.openedAt.toISOString(),
          closedAt: updatedShift.closedAt ? updatedShift.closedAt.toISOString() : null
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "open" or "close"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error managing shift:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Failed to manage shift', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cashierId = searchParams.get('cashierId')
    const isOpen = searchParams.get('isOpen')

    const where: any = {}

    if (cashierId) {
      where.cashierId = cashierId
    }

    if (isOpen !== null) {
      where.isOpen = isOpen === 'true'
    }

    const shifts = await prisma.cashierShift.findMany({
      where,
      select: {
        id: true,
        cashierId: true,
        openingBalance: true,
        closingBalance: true,
        totalSales: true,
        totalCash: true,
        totalNonCash: true,
        systemBalance: true,
        physicalBalance: true,
        difference: true,
        isOpen: true,
        openedAt: true,
        closedAt: true,
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: {
          select: {
            id: true,
            transactionNumber: true,
            totalAmount: true,
            finalAmount: true,
            paymentMethod: true,
            status: true,
            createdAt: true
          },
          where: {
            status: 'COMPLETED'
          }
        }
      },
      orderBy: {
        openedAt: 'desc'
      },
      take: 20
    })

    // Convert dates to ISO strings to avoid serialization issues
    const serializedShifts = shifts.map(shift => ({
      ...shift,
      openedAt: shift.openedAt.toISOString(),
      closedAt: shift.closedAt ? shift.closedAt.toISOString() : null,
      transactions: shift.transactions.map(trx => ({
        ...trx,
        createdAt: trx.createdAt.toISOString()
      }))
    }))

    return NextResponse.json({
      success: true,
      shifts: serializedShifts
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}
