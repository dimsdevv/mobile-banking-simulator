import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId, amount, bank, fee = 0 } = await request.json()

    if (!userId || !amount || !bank) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const topupAmount = BigInt(amount)
    const adminFee = BigInt(fee)

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get user
      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error('User not found')

      // 2. Add balance (only the actual top up amount)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: topupAmount } }
      })

      // 3. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: 'transfer_in',
          category: 'topup',
          amount: topupAmount,
          fee: adminFee,
          totalAmount: topupAmount + adminFee,
          reference: `TOPUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          description: `Top Up Saldo via ${bank}`,
          recipientId: user.id,
          recipientName: user.name,
          recipientAccount: user.accountNumber,
          recipientBank: 'SimBank',
          senderName: bank,
          senderAccount: 'Virtual Account',
          senderBank: bank
        }
      })

      // 4. Create notification
      const title = 'Top Up Berhasil'
      const msg = `Saldo sebesar Rp ${topupAmount.toLocaleString('id-ID')} telah berhasil ditambahkan ke akun Anda via ${bank}.`

      await tx.notification.create({
        data: {
          title,
          message: msg,
          type: 'success',
          isRead: false,
          userId: user.id
        }
      })

      return { updatedUser, transaction }
    })

    return NextResponse.json({
      success: true,
      balance: result.updatedUser.balance.toString()
    })

  } catch (error: any) {
    console.error('Topup error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
