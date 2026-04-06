/**
 * Create Cashier User Script
 * Creates a cashier user for demo purposes
 * Usage: bun run scripts/create-cashier.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CreateCashierParams {
  email: string
  password: string
  name: string
  phone?: string
}

async function createCashierUser(params: CreateCashierParams) {
  try {
    console.log('🔄 Creating cashier user...\n')

    // 1. Check if Role "Kasir" exists, if not create it
    let cashierRole = await prisma.role.findFirst({
      where: { name: 'Kasir' }
    })

    if (!cashierRole) {
      console.log('📋 Creating Kasir role...')
      cashierRole = await prisma.role.create({
        data: {
          name: 'Kasir'
        }
      })
      console.log('✅ Kasir role created\n')
    } else {
      console.log('✅ Kasir role already exists\n')
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: params.email }
    })

    if (existingUser) {
      console.log('⚠️  User already exists!')
      console.log('Email:', existingUser.email)
      console.log('Name:', existingUser.name)
      console.log('\nIf you want to update, please delete this user first.\n')
      return
    }

    // 3. Create cashier user
    console.log('👤 Creating cashier user...')

    const cashierUser = await prisma.user.create({
      data: {
        email: params.email,
        password: params.password, // Plain text (system limitation)
        name: params.name,
        phone: params.phone,
        roleId: cashierRole.id
      },
      include: {
        role: true
      }
    })

    console.log('\n✅ Cashier user created successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 CASHIER LOGIN CREDENTIALS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email   :', cashierUser.email)
    console.log('🔑 Password:', params.password)
    console.log('👤 Name    :', cashierUser.name)
    console.log('📱 Phone   :', cashierUser.phone || 'N/A')
    console.log('🔐 Role    :', cashierUser.role?.name)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('\n❌ Error creating cashier user:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Create default cashier user
createCashierUser({
  email: 'kasir@apssayamgeprek.com',
  password: 'kasir123',
  name: 'Kasir Demo',
  phone: '081234567891'
})
