import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch single cashier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    const cashier = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        },
        ...(includeStats && {
          _count: {
            select: {
              transactions: true,
              cashierShifts: true
            }
          }
        })
      }
    })

    if (!cashier) {
      return NextResponse.json(
        { error: 'Cashier not found' },
        { status: 404 }
      )
    }

    // Remove password from response
    const { password, ...cashierWithoutPassword } = cashier as any

    return NextResponse.json({
      success: true,
      data: cashierWithoutPassword
    })
  } catch (error) {
    console.error('Error fetching cashier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cashier' },
      { status: 500 }
    )
  }
}

// PUT - Update cashier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, password, phone, pin, roleId } = body

    const cashier = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!cashier) {
      return NextResponse.json(
        { error: 'Cashier not found' },
        { status: 404 }
      )
    }

    // Check if email is unique (if changed)
    if (email && email !== cashier.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email }
      })

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }
    }

    // Check if role exists (if changed)
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }
    }

    const updatedCashier = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(password !== undefined && { password }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(pin !== undefined && { pin: pin || null }),
        ...(roleId !== undefined && { roleId })
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Remove password from response
    const { password: _, ...cashierWithoutPassword } = updatedCashier as any

    return NextResponse.json({
      success: true,
      data: cashierWithoutPassword
    })
  } catch (error) {
    console.error('Error updating cashier:', error)
    return NextResponse.json(
      { error: 'Failed to update cashier' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate cashier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashier = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!cashier) {
      return NextResponse.json(
        { error: 'Cashier not found' },
        { status: 404 }
      )
    }

    // Check if cashier has open shifts
    const openShift = await prisma.cashierShift.findFirst({
      where: {
        cashierId: params.id,
        isOpen: true
      }
    })

    if (openShift) {
      return NextResponse.json(
        { error: 'Cannot delete cashier with open shift' },
        { status: 400 }
      )
    }

    // Instead of deleting, we could mark as inactive
    // But for now, let's delete
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cashier deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting cashier:', error)
    return NextResponse.json(
      { error: 'Failed to delete cashier' },
      { status: 500 }
    )
  }
}
