import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const type = searchParams.get('type') // 'all' | 'transfer_in' | 'transfer_out'
  const search = searchParams.get('search')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Build where clause for sent transactions
    const sentWhere: any = { senderId: userId }
    const receivedWhere: any = { recipientId: userId }

    // Type filter
    if (type && type !== 'all') {
      if (type === 'transfer_out') {
        receivedWhere.id = '__impossible__' // exclude received
      } else if (type === 'transfer_in') {
        sentWhere.id = '__impossible__' // exclude sent
      }
    }

    // Search filter
    if (search) {
      const searchFilter = {
        OR: [
          { recipientName: { contains: search } },
          { senderName: { contains: search } },
          { description: { contains: search } },
          { reference: { contains: search } },
        ]
      }
      Object.assign(sentWhere, searchFilter)
      Object.assign(receivedWhere, searchFilter)
    }

    // Date filter
    if (startDate) {
      const dateFilter = { createdAt: { gte: new Date(startDate) } }
      Object.assign(sentWhere, dateFilter)
      Object.assign(receivedWhere, dateFilter)
    }
    if (endDate) {
      const endDateObj = new Date(endDate)
      endDateObj.setHours(23, 59, 59, 999)
      const existing = sentWhere.createdAt || {}
      sentWhere.createdAt = { ...existing, lte: endDateObj }
      receivedWhere.createdAt = { ...(receivedWhere.createdAt || {}), lte: endDateObj }
    }

    // Fetch both sent and received
    const [sent, received] = await Promise.all([
      prisma.transaction.findMany({ where: sentWhere, orderBy: { createdAt: 'desc' } }),
      prisma.transaction.findMany({ where: receivedWhere, orderBy: { createdAt: 'desc' } }),
    ])

    // Merge, deduplicate, sort
    const allMap = new Map<string, typeof sent[0]>()
    for (const t of [...sent, ...received]) {
      allMap.set(t.id, t)
    }
    const all = Array.from(allMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = all.length
    const paginated = all.slice((page - 1) * limit, page * limit)

    // Safely serialize BigInt
    const safeTransactions = paginated.map(t => ({
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

    // Monthly summary
    const totalIn = all.filter(t => t.type === 'transfer_in').reduce((sum, t) => sum + t.amount, BigInt(0))
    const totalOut = all.filter(t => t.type === 'transfer_out').reduce((sum, t) => sum + t.amount, BigInt(0))

    return NextResponse.json({
      success: true,
      transactions: safeTransactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalIncome: totalIn.toString(),
        totalExpense: totalOut.toString(),
        transactionCount: total,
      }
    })
  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
