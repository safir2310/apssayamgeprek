import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch single member with history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      ...(includeHistory && {
        include: {
          pointHistory: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 20
          }
        }
      })
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: member
    })
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

// PUT - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params
    const body = await request.json()
    const { name, phone, email, address, points, isActive } = body

    const member = await prisma.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if phone is unique (if changed)
    if (phone && phone !== member.phone) {
      const duplicateMember = await prisma.member.findUnique({
        where: { phone }
      })

      if (duplicateMember) {
        return NextResponse.json(
          { error: 'Phone number already registered' },
          { status: 400 }
        )
      }
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
        ...(points !== undefined && { points: parseInt(points) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedMember
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Deactivate instead of delete
    await prisma.member.update({
      where: { id: memberId },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Member deactivated successfully'
    })
  } catch (error) {
    console.error('Error deactivating member:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate member' },
      { status: 500 }
    )
  }
}
