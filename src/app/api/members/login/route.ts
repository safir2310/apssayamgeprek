import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password diperlukan' },
        { status: 400 }
      )
    }

    console.log('Member login attempt for email:', email)

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email }
    })

    if (!member) {
      console.log('Member not found for email:', email)
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Verify password (in a real app, use bcrypt or similar)
    if (member.password !== password) {
      console.log('Password mismatch for member:', email)
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Check if member is active
    if (!member.isActive) {
      console.log('Member account is inactive:', email)
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan' },
        { status: 403 }
      )
    }

    console.log('Member login successful for:', email)

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        username: member.username,
        name: member.name,
        email: member.email,
        phone: member.phone,
        points: member.points
      }
    })
  } catch (error) {
    console.error('Error during member login:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan koneksi. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
