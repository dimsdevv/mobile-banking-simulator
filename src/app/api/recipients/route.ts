import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const recipients = await prisma.savedRecipient.findMany({
      where: { userId },
      orderBy: [
        { isFavorite: 'desc' },
        { lastUsed: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, recipients })
  } catch (error) {
    console.error('Recipients fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
