import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address, password } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingMember = await db.member.findUnique({
      where: { phone }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar' },
        { status: 400 }
      )
    }

    // Create new member
    const member = await db.member.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        points: 0,
        isActive: true
      }
    })

    // Note: In a real application, you would hash the password and store it
    // For now, we're just creating the member account

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        points: member.points
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Gagal mendaftar. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
