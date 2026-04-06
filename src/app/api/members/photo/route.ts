import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, photo } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo data is required' },
        { status: 400 }
      )
    }

    // Update member photo
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: { photo }
    })

    return NextResponse.json({
      success: true,
      photo: updatedMember.photo
    })
  } catch (error) {
    console.error('Error updating member photo:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui foto profil' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('id')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Remove member photo
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: { photo: null }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error removing member photo:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus foto profil' },
      { status: 500 }
    )
  }
}
