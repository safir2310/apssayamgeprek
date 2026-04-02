import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create roles
  let adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } })
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'Admin' } })
  }

  let cashierRole = await prisma.role.findFirst({ where: { name: 'Kasir' } })
  if (!cashierRole) {
    cashierRole = await prisma.role.create({ data: { name: 'Kasir' } })
  }

  let ownerRole = await prisma.role.findFirst({ where: { name: 'Owner' } })
  if (!ownerRole) {
    ownerRole = await prisma.role.create({ data: { name: 'Owner' } })
  }

  let userRole = await prisma.role.findFirst({ where: { name: 'User' } })
  if (!userRole) {
    userRole = await prisma.role.create({ data: { name: 'User' } })
  }

  console.log('Roles created:', { adminRole, cashierRole, ownerRole, userRole })

  // Create admin user (password: admin123, PIN: 1234)
  let adminUser = await prisma.user.findFirst({ where: { email: 'admin@ayamgeprek.com' } })
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@ayamgeprek.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
        name: 'Admin',
        phone: '085260812758',
        pin: '1234',
        roleId: adminRole.id
      }
    })
  }

  console.log('Admin user created:', adminUser)

  // Create categories
  let ayamGeprekCategory = await prisma.category.findFirst({ where: { name: 'Ayam Geprek' } })
  if (!ayamGeprekCategory) {
    ayamGeprekCategory = await prisma.category.create({ data: { name: 'Ayam Geprek' } })
  }

  let nasiCategory = await prisma.category.findFirst({ where: { name: 'Nasi' } })
  if (!nasiCategory) {
    nasiCategory = await prisma.category.create({ data: { name: 'Nasi' } })
  }

  let minumanCategory = await prisma.category.findFirst({ where: { name: 'Minuman' } })
  if (!minumanCategory) {
    minumanCategory = await prisma.category.create({ data: { name: 'Minuman' } })
  }

  let laukCategory = await prisma.category.findFirst({ where: { name: 'Lauk' } })
  if (!laukCategory) {
    laukCategory = await prisma.category.create({ data: { name: 'Lauk' } })
  }

  console.log('Categories created:', { ayamGeprekCategory, nasiCategory, minumanCategory, laukCategory })

  // Create products
  const products = [
    {
      name: 'Ayam Geprek Sambal Ijo',
      barcode: '001',
      description: 'Ayam goreng geprek dengan sambal ijo pedas',
      price: 15000,
      cost: 10000,
      stock: 50,
      categoryId: ayamGeprekCategory.id
    },
    {
      name: 'Ayam Geprek Original',
      barcode: '002',
      description: 'Ayam goreng geprek dengan sambal merah',
      price: 13000,
      cost: 9000,
      stock: 45,
      categoryId: ayamGeprekCategory.id
    },
    {
      name: 'Ayam Geprek Mozarella',
      barcode: '003',
      description: 'Ayam geprek dengan topping mozarella lumer',
      price: 18000,
      cost: 13000,
      stock: 30,
      categoryId: ayamGeprekCategory.id
    },
    {
      name: 'Nasi Putih',
      barcode: '004',
      description: 'Nasi putih hangat',
      price: 4000,
      cost: 2000,
      stock: 100,
      categoryId: nasiCategory.id
    },
    {
      name: 'Nasi Uduk',
      barcode: '005',
      description: 'Nasi uduk dengan rempah',
      price: 6000,
      cost: 3500,
      stock: 50,
      categoryId: nasiCategory.id
    },
    {
      name: 'Es Teh Manis',
      barcode: '006',
      description: 'Es teh manis segar',
      price: 5000,
      cost: 2000,
      stock: 80,
      categoryId: minumanCategory.id
    },
    {
      name: 'Es Jeruk',
      barcode: '007',
      description: 'Es jeruk peras segar',
      price: 6000,
      cost: 3000,
      stock: 60,
      categoryId: minumanCategory.id
    },
    {
      name: 'Teh Hangat',
      barcode: '008',
      description: 'Teh hangat manis',
      price: 4000,
      cost: 1500,
      stock: 70,
      categoryId: minumanCategory.id
    },
    {
      name: 'Jus Alpukat',
      barcode: '009',
      description: 'Jus alpukat segar dengan susu coklat',
      price: 12000,
      cost: 7000,
      stock: 40,
      categoryId: minumanCategory.id
    },
    {
      name: 'Tempe Goreng',
      barcode: '010',
      description: 'Tempe goreng renyah',
      price: 3000,
      cost: 1500,
      stock: 60,
      categoryId: laukCategory.id
    },
    {
      name: 'Tahu Goreng',
      barcode: '011',
      description: 'Tahu goreng renyah',
      price: 3000,
      cost: 1500,
      stock: 60,
      categoryId: laukCategory.id
    },
    {
      name: 'Telur Dadar',
      barcode: '012',
      description: 'Telur dadar tebal',
      price: 5000,
      cost: 3000,
      stock: 40,
      categoryId: laukCategory.id
    }
  ]

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { barcode: product.barcode } })
    if (!existing) {
      await prisma.product.create({ data: product })
    }
  }

  console.log('Products created:', products.length)

  // Create a sample promo
  let promo = await prisma.promo.findFirst({ where: { code: 'HEMAT10' } })
  if (!promo) {
    promo = await prisma.promo.create({
      data: {
        code: 'HEMAT10',
        name: 'Diskon 10%',
        description: 'Diskon 10% untuk semua menu',
        type: 'PERCENTAGE',
        value: 10,
        minPurchase: 20000,
        maxDiscount: 10000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      }
    })
  }

  console.log('Promo created:', promo)

  // Create a sample member
  let member = await prisma.member.findFirst({ where: { phone: '081234567890' } })
  if (!member) {
    member = await prisma.member.create({
      data: {
        phone: '081234567890',
        name: 'Budi Santoso',
        email: 'budi@example.com',
        address: 'Jl. Contoh No. 123',
        points: 100
      }
    })
  }

  console.log('Member created:', member)

  console.log('Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
