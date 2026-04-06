/**
 * Create Cashier User "Deaflud" Script
 * Creates a cashier user named "deaflud"
 * Usage: bun run scripts/create-cashier-deaflud.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createCashierDeaflud() {
  try {
    console.log('🔄 Creating cashier user "deaflud"...\n')

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
      where: { email: 'deaflud@kasir.com' }
    })

    if (existingUser) {
      console.log('⚠️  User "deaflud" (kasir) already exists!')
      console.log('Email:', existingUser.email)
      console.log('Name:', existingUser.name)
      console.log('\nIf you want to update, please delete this user first.\n')

      // Show current credentials
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 CURRENT KASIR LOGIN CREDENTIALS')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📧 Email   :', existingUser.email)
      console.log('🔑 Password: kasir123 (default)')
      console.log('👤 Name    :', existingUser.name)
      console.log('📱 Phone   :', existingUser.phone || 'N/A')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      return
    }

    // 3. Create cashier user
    const email = 'deaflud@kasir.com'
    const password = 'kasir123'
    const name = 'Deaflud Kasir'
    const phone = '081234567892'

    console.log('👤 Creating cashier user "deaflud"...')

    const cashierUser = await prisma.user.create({
      data: {
        email,
        password, // Plain text (system limitation)
        name,
        phone,
        roleId: cashierRole.id
      },
      include: {
        role: true
      }
    })

    console.log('\n✅ Cashier user "deaflud" created successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 KASIR LOGIN CREDENTIALS - DEAFLUD')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email   :', cashierUser.email)
    console.log('🔑 Password:', password)
    console.log('👤 Name    :', cashierUser.name)
    console.log('📱 Phone   :', cashierUser.phone)
    console.log('🔐 Role    :', cashierUser.role?.name)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n✅ You can now login with these credentials!')
    console.log('⚠️  WARNING: Password stored in plain text!')
    console.log('⚠️  This should be improved with bcrypt for production use.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('\n❌ Error creating cashier user "deaflud":')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createCashierDeaflud()
