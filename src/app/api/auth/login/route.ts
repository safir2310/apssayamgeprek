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

    console.log('Login attempt for email:', email)

    // Find user by email with role
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      console.log('User not found for email:', email)
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role })

    // Verify password
    // In a real app, use bcrypt: await bcrypt.compare(password, user.password)
    // For now, using plain text comparison
    if (user.password !== password) {
      console.log('Password mismatch for user:', email)
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Check if role exists
    if (!user.role) {
      console.log('User has no role:', email)
      return NextResponse.json(
        { error: 'User tidak memiliki role. Hubungi administrator.' },
        { status: 403 }
      )
    }

    console.log('Login successful for:', email, 'with role:', user.role.name)

    // Return success with user data including role
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role.name,
        roleId: user.roleId,
        pin: user.pin
      }
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan koneksi. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
