import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get the first settings record (should be only one)
    let settings = await db.settings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.settings.create({
        data: {
          storeName: 'AYAM GEPREK SAMBAL IJO',
          storeAddress: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
          storePhone: '085260812758',
          qrisEnabled: true
        }
      })
    }

    return NextResponse.json({
      id: settings.id,
      storeName: settings.storeName,
      storeAddress: settings.storeAddress,
      storePhone: settings.storePhone,
      qrisImage: settings.qrisImage,
      qrisEnabled: settings.qrisEnabled
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Get or create settings
    let settings = await db.settings.findFirst()

    if (settings) {
      // Update existing settings
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          storeName: body.storeName || settings.storeName,
          storeAddress: body.storeAddress !== undefined ? body.storeAddress : settings.storeAddress,
          storePhone: body.storePhone !== undefined ? body.storePhone : settings.storePhone,
          qrisImage: body.qrisImage !== undefined ? body.qrisImage : settings.qrisImage,
          qrisEnabled: body.qrisEnabled !== undefined ? body.qrisEnabled : settings.qrisEnabled
        }
      })
    } else {
      // Create new settings
      settings = await db.settings.create({
        data: {
          storeName: body.storeName || 'AYAM GEPREK SAMBAL IJO',
          storeAddress: body.storeAddress,
          storePhone: body.storePhone,
          qrisImage: body.qrisImage,
          qrisEnabled: body.qrisEnabled ?? true
        }
      })
    }

    return NextResponse.json({
      id: settings.id,
      storeName: settings.storeName,
      storeAddress: settings.storeAddress,
      storePhone: settings.storePhone,
      qrisImage: settings.qrisImage,
      qrisEnabled: settings.qrisEnabled
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
