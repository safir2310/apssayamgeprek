import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phoneLast4 } = body

    // Validate input
    if (!email || !phoneLast4) {
      return NextResponse.json(
        { error: 'Email dan 4 digit terakhir nomor HP diperlukan' },
        { status: 400 }
      )
    }

    // Validate phone last 4 digits
    if (!/^\d{4}$/.test(phoneLast4)) {
      return NextResponse.json(
        { error: '4 digit terakhir nomor HP tidak valid' },
        { status: 400 }
      )
    }

    // Find member by email
    const member = await db.member.findUnique({
      where: {
        email: email.toLowerCase()
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if last 4 digits of phone match
    const last4Digits = member.phone.slice(-4)
    if (last4Digits !== phoneLast4) {
      return NextResponse.json(
        { error: '4 digit terakhir nomor HP tidak cocok' },
        { status: 400 }
      )
    }

    // Return success with member ID
    return NextResponse.json({
      success: true,
      memberId: member.id
    })
  } catch (error) {
    console.error('Verify forgot password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memverifikasi akun' },
      { status: 500 }
    )
  }
}
