import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        receivedTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Combine and sort transactions
    const allTransactions = [...user.sentTransactions, ...user.receivedTransactions]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)

    // Manually construct safe JSON (no BigInt leaking through spread)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      accountNumber: user.accountNumber,
      balance: user.balance.toString(),
      theme: user.theme,
      language: user.language,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    const safeTransactions = allTransactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toString(),
      fee: t.fee.toString(),
      totalAmount: t.totalAmount.toString(),
      description: t.description,
      reference: t.reference,
      status: t.status,
      category: t.category,
      senderId: t.senderId,
      senderName: t.senderName,
      senderAccount: t.senderAccount,
      senderBank: t.senderBank,
      recipientId: t.recipientId,
      recipientName: t.recipientName,
      recipientAccount: t.recipientAccount,
      recipientBank: t.recipientBank,
      createdAt: t.createdAt,
    }))

    return NextResponse.json({
      success: true,
      user: safeUser,
      recentTransactions: safeTransactions,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
