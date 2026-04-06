import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, name, phone, address } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Check if phone is already taken by another member
    if (phone) {
      const existingMember = await db.member.findFirst({
        where: {
          phone,
          NOT: {
            id: memberId
          }
        }
      })

      if (existingMember) {
        return NextResponse.json(
          { error: 'Nomor telepon sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Update member profile
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address !== undefined && { address })
      }
    })

    return NextResponse.json({
      success: true,
      member: updatedMember
    })
  } catch (error) {
    console.error('Error updating member profile:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui profil' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('id')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    const member = await db.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        photo: true,
        points: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching member profile:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data profil' },
      { status: 500 }
    )
  }
}
