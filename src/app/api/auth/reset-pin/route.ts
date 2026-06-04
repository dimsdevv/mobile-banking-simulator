import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function PUT(request: Request) {
  try {
    const { userId, newPin } = await request.json()

    if (!userId || !newPin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: 'PIN harus 6 digit angka' }, { status: 400 })
    }

    const pinHash = await bcrypt.hash(newPin, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { pinHash }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Reset PIN error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
