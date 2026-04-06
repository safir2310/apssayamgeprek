import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all roles
export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: roles
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}
