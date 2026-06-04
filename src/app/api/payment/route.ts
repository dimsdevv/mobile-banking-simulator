import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const { senderId, merchantName, amount, pin } = await request.json()

    if (!senderId || !merchantName || !amount || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } })
    if (!sender) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, sender.pinHash)
    if (!isValidPin) {
      return NextResponse.json({ error: 'PIN salah' }, { status: 401 })
    }

    const parsedAmount = BigInt(amount)
    if (sender.balance < parsedAmount) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    // Execute payment in transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Deduct sender balance
      await tx.user.update({
        where: { id: senderId },
        data: { balance: { decrement: parsedAmount } }
      })

      // 2. Create transaction record
      const reference = `QR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 100000)}`
      
      return tx.transaction.create({
        data: {
          type: 'payment',
          category: 'food', // Example category
          amount: parsedAmount,
          totalAmount: parsedAmount,
          reference,
          description: `QR Pay - ${merchantName}`,
          senderId: sender.id,
          senderName: sender.name,
          senderAccount: sender.accountNumber,
          recipientName: merchantName,
          recipientAccount: '0000000000', // Dummy merchant account
          recipientBank: 'QRIS',
        }
      })
    })

    return NextResponse.json({ 
      success: true, 
      transaction: {
        ...transaction,
        amount: transaction.amount.toString(),
        totalAmount: transaction.totalAmount.toString(),
        fee: transaction.fee.toString(),
      }
    })

  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
