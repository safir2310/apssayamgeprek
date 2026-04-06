import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const paymentMethods = [
    {
      code: 'CASH',
      name: 'Tunai',
      description: 'Pembayaran dengan uang tunai',
      icon: 'DollarSign',
      isActive: true,
      sortOrder: 0
    },
    {
      code: 'QRIS',
      name: 'QRIS',
      description: 'Pembayaran menggunakan QRIS',
      icon: 'QrCode',
      isActive: true,
      sortOrder: 1
    },
    {
      code: 'TRANSFER',
      name: 'Transfer Bank',
      description: 'Pembayaran melalui transfer bank',
      icon: 'Landmark',
      isActive: true,
      sortOrder: 2
    },
    {
      code: 'E_WALLET',
      name: 'E-Wallet',
      description: 'Pembayaran menggunakan e-wallet (GoPay, OVO, Dana, dll)',
      icon: 'Smartphone',
      isActive: true,
      sortOrder: 3
    }
  ]

  for (const method of paymentMethods) {
    const existing = await prisma.paymentMethod.findUnique({
      where: { code: method.code }
    })

    if (!existing) {
      await prisma.paymentMethod.create({
        data: method
      })
      console.log(`✓ Created payment method: ${method.name}`)
    } else {
      console.log(`- Payment method already exists: ${method.name}`)
    }
  }

  console.log('\n✅ Payment methods seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding payment methods:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
