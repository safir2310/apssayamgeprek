import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Create Default Roles
  console.log('Creating roles...')

  // Find or create admin role
  let adminRole = await prisma.role.findFirst({
    where: { name: 'admin' }
  })

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'admin' }
    })
  }

  // Find or create cashier role
  let cashierRole = await prisma.role.findFirst({
    where: { name: 'kasir' }
  })

  if (!cashierRole) {
    cashierRole = await prisma.role.create({
      data: { name: 'kasir' }
    })
  }

  console.log('✅ Roles created:', { admin: adminRole.name, cashier: cashierRole.name })

  // 2. Create Default Users
  console.log('Creating users...')

  // Default Admin
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@geprek.com' }
  })

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@geprek.com',
        password: 'admin123',
        name: 'Administrator',
        phone: '081234567890',
        pin: '123456',
        roleId: adminRole.id,
      },
    })
  }

  // Default Cashier
  let cashier = await prisma.user.findUnique({
    where: { email: 'kasir@geprek.com' }
  })

  if (!cashier) {
    cashier = await prisma.user.create({
      data: {
        email: 'kasir@geprek.com',
        password: 'kasir123',
        name: 'Kasir Utama',
        phone: '081234567891',
        pin: '234567',
        roleId: cashierRole.id,
      },
    })
  }

  console.log('✅ Users created:', {
    admin: admin.email,
    cashier: cashier.email,
  })

  // 3. Create Default Member (User/Member)
  console.log('Creating members...')

  let member = await prisma.member.findFirst({
    where: { username: 'member' }
  })

  if (!member) {
    member = await prisma.member.create({
      data: {
        username: 'member',
        password: 'member123',
        name: 'Member Demo',
        phone: '081234567892',
        email: 'member@geprek.com',
        address: 'Jl. Demo No. 123',
        points: 100,
        isActive: true,
      },
    })
  }

  console.log('✅ Member created:', { username: member.username, email: member.email })

  // 4. Create Default Categories
  console.log('Creating categories...')

  const categories = [
    { name: 'Ayam Geprek' },
    { name: 'Minuman' },
    { name: 'Nasi' },
    { name: 'Tambahan' },
  ]

  const createdCategories = []
  for (const cat of categories) {
    let category = await prisma.category.findUnique({
      where: { name: cat.name }
    })

    if (!category) {
      category = await prisma.category.create({
        data: cat
      })
    }
    createdCategories.push(category)
  }

  console.log('✅ Categories created:', createdCategories.map((c) => c.name))

  // 5. Create Default Products
  console.log('Creating products...')

  const products = [
    {
      name: 'Ayam Geprek Sambal Ijo',
      description: 'Ayam goreng geprek dengan sambal ijo pedas',
      price: 15000,
      cost: 8000,
      stock: 100,
      barcode: 'AG001',
      categoryId: createdCategories[0].id,
      image: null,
    },
    {
      name: 'Ayam Geprek Sambal Merah',
      description: 'Ayam goreng geprek dengan sambal merah pedas',
      price: 15000,
      cost: 8000,
      stock: 100,
      barcode: 'AG002',
      categoryId: createdCategories[0].id,
      image: null,
    },
    {
      name: 'Es Teh Manis',
      description: 'Es teh manis segar',
      price: 5000,
      cost: 1500,
      stock: 200,
      barcode: 'ETM001',
      categoryId: createdCategories[1].id,
      image: null,
    },
    {
      name: 'Es Jeruk',
      description: 'Es jeruk segar',
      price: 6000,
      cost: 2000,
      stock: 200,
      barcode: 'EJ001',
      categoryId: createdCategories[1].id,
      image: null,
    },
    {
      name: 'Nasi Putih',
      description: 'Nasi putih hangat',
      price: 5000,
      cost: 2000,
      stock: 300,
      barcode: 'NP001',
      categoryId: createdCategories[2].id,
      image: null,
    },
  ]

  const createdProducts = []
  for (const product of products) {
    let prod = await prisma.product.findUnique({
      where: { barcode: product.barcode }
    })

    if (!prod) {
      prod = await prisma.product.create({
        data: product,
      })
    }
    createdProducts.push(prod)
  }

  console.log('✅ Products created:', createdProducts.map((p) => p.name))

  // 6. Create Default Settings
  console.log('Creating settings...')

  let settings = await prisma.settings.findFirst()

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        storeName: 'Ayam Geprek Sambal Ijo',
        storeAddress: 'Jl. Contoh No. 123, Jakarta',
        storePhone: '085260812758',
        qrisEnabled: false,
        qrisImage: null,
      },
    })
  }

  console.log('✅ Settings created:', { storeName: settings.storeName })

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📋 Default Accounts:')
  console.log('═══════════════════════════════════════════════')
  console.log('👤 Admin:')
  console.log('   Email: admin@geprek.com')
  console.log('   Password: admin123')
  console.log('   PIN: 123456')
  console.log('\n👤 Kasir:')
  console.log('   Email: kasir@geprek.com')
  console.log('   Password: kasir123')
  console.log('   PIN: 234567')
  console.log('\n👤 Member:')
  console.log('   Email: member@geprek.com')
  console.log('   Password: member123')
  console.log('   Phone: 081234567892')
  console.log('   Username: member')
  console.log('═══════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
