import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, name, phone, email, address } = body

    // Validation
    if (!username || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'Username, password, nama, dan nomor telepon diperlukan' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username minimal 3 karakter' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    if (phone.length < 10) {
      return NextResponse.json(
        { error: 'Nomor telepon minimal 10 digit' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.member.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      )
    }

    // Check if phone already exists
    const existingPhone = await prisma.member.findUnique({
      where: { phone }
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar' },
        { status: 409 }
      )
    }

    // Create new member
    const member = await prisma.member.create({
      data: {
        username,
        password,
        name,
        phone,
        email: email || null,
        address: address || null
      }
    })

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        username: member.username,
        name: member.name,
        phone: member.phone,
        email: member.email,
        points: member.points
      }
    })
  } catch (error) {
    console.error('Error during member registration:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mendaftar' },
      { status: 500 }
    )
  }
}
