import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, notificationOrders, notificationPromo, notificationPoints } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Update notification preferences
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        ...(notificationOrders !== undefined && { notificationOrders }),
        ...(notificationPromo !== undefined && { notificationPromo }),
        ...(notificationPoints !== undefined && { notificationPoints })
      }
    })

    return NextResponse.json({
      success: true,
      notifications: {
        notificationOrders: updatedMember.notificationOrders,
        notificationPromo: updatedMember.notificationPromo,
        notificationPoints: updatedMember.notificationPoints
      }
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui pengaturan notifikasi' },
      { status: 500 }
    )
  }
}
