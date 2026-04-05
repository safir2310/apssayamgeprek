import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Find member by phone number
    const member = await db.member.findUnique({
      where: {
        phone: phone,
        isActive: true
      }
    })

    if (!member) {
      return NextResponse.json(
        { found: false },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        found: true,
        member: {
          id: member.id,
          name: member.name,
          phone: member.phone,
          email: member.email,
          address: member.address,
          points: member.points
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error looking up member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
