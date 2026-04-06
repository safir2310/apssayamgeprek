import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, photo } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID diperlukan' },
        { status: 400 }
      )
    }

    if (!photo) {
      return NextResponse.json(
        { error: 'Data foto diperlukan' },
        { status: 400 }
      )
    }

    // Validate photo is a valid base64 image
    if (!photo.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Format foto tidak valid. Harap upload gambar.' },
        { status: 400 }
      )
    }

    // Check file size (base64 length * 0.75 ≈ bytes, max 5MB)
    const base64Data = photo.split(',')[1] || ''
    const fileSizeInBytes = Math.floor((base64Data.length * 3) / 4)
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (fileSizeInBytes > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar. Maksimal 5MB.' },
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
      { error: 'Gagal memperbarui foto profil. Silakan coba lagi.' },
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
        { error: 'Member ID diperlukan' },
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
      { error: 'Gagal menghapus foto profil. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
