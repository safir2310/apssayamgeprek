/**
 * Create Admin User Script
 * Creates an admin user with specified credentials
 * Usage: bun run scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CreateAdminParams {
  email: string
  password: string
  name: string
  phone?: string
}

async function createAdminUser(params: CreateAdminParams) {
  try {
    console.log('🔄 Creating admin user...\n')

    // 1. Check if Role "Admin" exists, if not create it
    let adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    })

    if (!adminRole) {
      console.log('📋 Creating Admin role...')
      adminRole = await prisma.role.create({
        data: {
          name: 'Admin'
        }
      })
      console.log('✅ Admin role created\n')
    } else {
      console.log('✅ Admin role already exists\n')
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

    // 3. Create admin user
    // Note: System uses plain text password comparison (should be improved for production)
    console.log('👤 Creating admin user...')

    const adminUser = await prisma.user.create({
      data: {
        email: params.email,
        password: params.password, // Plain text (system limitation)
        name: params.name,
        phone: params.phone,
        roleId: adminRole.id
      },
      include: {
        role: true
      }
    })

    console.log('\n✅ Admin user created successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 ADMIN LOGIN CREDENTIALS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email   :', adminUser.email)
    console.log('🔑 Password:', params.password)
    console.log('👤 Name    :', adminUser.name)
    console.log('📱 Phone   :', adminUser.phone || 'N/A')
    console.log('🔐 Role    :', adminUser.role?.name)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  WARNING: Password stored in plain text!')
    console.log('⚠️  This should be improved with bcrypt for production use.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('\n❌ Error creating admin user:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Create default admin user "deaflud"
createAdminUser({
  email: 'deaflud@admin.com',
  password: 'admin123',
  name: 'Deaflud Admin',
  phone: '081234567890'
})
