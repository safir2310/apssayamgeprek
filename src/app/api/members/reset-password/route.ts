import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, newPassword } = body

    // Validate input
    if (!memberId || !newPassword) {
      return NextResponse.json(
        { error: 'Member ID dan password baru diperlukan' },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Check if member exists
    const member = await db.member.findUnique({
      where: {
        id: memberId
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update password
    await db.member.update({
      where: {
        id: memberId
      },
      data: {
        password: newPassword
      }
    })

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengubah password' },
      { status: 500 }
    )
  }
}
