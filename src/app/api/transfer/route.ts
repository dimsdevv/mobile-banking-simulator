import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const { senderId, recipientAccount, recipientName, recipientBank, amount, description, pin } = await request.json()

    // Validate required fields
    if (!senderId || !recipientAccount || !recipientName || !amount || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amountBigInt = BigInt(amount)
    if (amountBigInt <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    // Get sender
    const sender = await prisma.user.findUnique({ where: { id: senderId } })
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, sender.pinHash)
    if (!isPinValid) {
      return NextResponse.json({ error: 'PIN salah' }, { status: 401 })
    }

    // Check balance
    const fee = BigInt(0)
    const totalAmount = amountBigInt + fee

    if (sender.balance < totalAmount) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    const reference = `TRX-${Date.now()}-${randomUUID().slice(0, 8)}`

    // Execute transfer in a transaction
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: 'transfer_out',
          amount: amountBigInt,
          fee,
          totalAmount,
          description: description || null,
          reference,
          status: 'success',
          category: 'transfer',
          senderId: sender.id,
          senderName: sender.name,
          senderAccount: sender.accountNumber,
          senderBank: 'SimBank',
          recipientName,
          recipientAccount,
          recipientBank: recipientBank || 'SimBank',
        }
      }),
      prisma.user.update({
        where: { id: sender.id },
        data: { balance: { decrement: totalAmount } }
      })
    ])

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        fee: transaction.fee.toString(),
        totalAmount: transaction.totalAmount.toString(),
        description: transaction.description,
        reference: transaction.reference,
        status: transaction.status,
        senderName: transaction.senderName,
        senderAccount: transaction.senderAccount,
        recipientName: transaction.recipientName,
        recipientAccount: transaction.recipientAccount,
        recipientBank: transaction.recipientBank,
        createdAt: transaction.createdAt,
      }
    })
  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
