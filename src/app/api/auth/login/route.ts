import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const { accountNumber, pin } = await request.json()

    if (!accountNumber || !pin) {
      return NextResponse.json({ error: 'Account number and PIN are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { accountNumber }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isPinValid = await bcrypt.compare(pin, user.pinHash)

    if (!isPinValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Don't send the pinHash back to the client, and convert BigInt to String
    const { pinHash, balance, ...userWithoutPin } = user

    return NextResponse.json({ 
      success: true, 
      user: {
        ...userWithoutPin,
        balance: balance.toString()
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
