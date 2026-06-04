import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  try {
    let goal = await prisma.savingsGoal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!goal) {
      goal = await prisma.savingsGoal.create({
        data: {
          userId,
          name: 'MacBook Pro',
          target: BigInt(20000000),
          current: BigInt(0)
        }
      })
    }

    return NextResponse.json({
      success: true,
      goal: {
        id: goal.id,
        name: goal.name,
        target: goal.target.toString(),
        current: goal.current.toString()
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const parsedAmount = BigInt(amount)

    if (user.balance < parsedAmount) {
      return NextResponse.json({ error: 'Saldo rekening utama tidak cukup' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: parsedAmount } }
      })

      // 2. Add to goal
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goal.id },
        data: { current: { increment: parsedAmount } }
      })

      // 3. Record transaction
      await tx.transaction.create({
        data: {
          type: 'transfer_out', // using transfer_out so it deducts in Mutasi calculation
          amount: parsedAmount,
          fee: BigInt(0),
          totalAmount: parsedAmount,
          description: 'Top Up Kantong: ' + goal.name,
          reference: `SAV${Date.now()}`,
          status: 'success',
          category: 'savings',
          senderId: userId,
          senderName: user.name,
          senderAccount: user.accountNumber,
          senderBank: 'SimBank',
          recipientName: 'Kantong Nabung',
          recipientAccount: 'SAVINGS-GOAL',
          recipientBank: 'SimBank'
        }
      })

      return updatedGoal
    })

    return NextResponse.json({
      success: true,
      goal: {
        id: result.id,
        name: result.name,
        target: result.target.toString(),
        current: result.current.toString()
      }
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
