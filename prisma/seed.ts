import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.transaction.deleteMany()
  await prisma.savedRecipient.deleteMany()
  await prisma.user.deleteMany()

  // Create main user
  const pinHash = await bcrypt.hash('123456', 10)
  
  const mainUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@simbank.com',
      accountNumber: '1234567890',
      pinHash,
      balance: 15000000,
      isOnboarded: true,
      savedRecipients: {
        create: [
          {
            name: 'Jane Smith',
            accountNumber: '0987654321',
            bankName: 'BCA',
            isFavorite: true,
          },
          {
            name: 'Michael',
            accountNumber: '1122334455',
            bankName: 'Mandiri',
            isFavorite: false,
          }
        ]
      }
    }
  })

  // Create a dummy user for receiving transactions
  const dummyUser = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      accountNumber: '9988776655',
      pinHash,
      balance: 5000000,
    }
  })

  // Create some transactions
  await prisma.transaction.create({
    data: {
      type: 'transfer_out',
      amount: 500000,
      totalAmount: 500000,
      description: 'Bayar utang',
      reference: 'TRX-123456789',
      status: 'success',
      senderId: mainUser.id,
      senderName: mainUser.name,
      senderAccount: mainUser.accountNumber,
      recipientName: dummyUser.name,
      recipientAccount: dummyUser.accountNumber,
      recipientBank: 'SimBank'
    }
  })
  
  await prisma.transaction.create({
    data: {
      type: 'transfer_in',
      amount: 1500000,
      totalAmount: 1500000,
      description: 'Gajian',
      reference: 'TRX-987654321',
      status: 'success',
      recipientId: mainUser.id,
      recipientName: mainUser.name,
      recipientAccount: mainUser.accountNumber,
      recipientBank: 'SimBank',
      senderName: 'PT Perusahaan',
      senderAccount: '1111111111',
      senderBank: 'BCA'
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
