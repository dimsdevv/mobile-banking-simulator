import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function PUT(request: Request) {
  try {
    const { userId, currentPin, newPin } = await request.json()

    if (!userId || !currentPin || !newPin) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: 'PIN baru harus 6 digit angka' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current PIN
    const isValid = await bcrypt.compare(currentPin, user.pinHash)
    if (!isValid) {
      return NextResponse.json({ error: 'PIN lama salah' }, { status: 401 })
    }

    // Hash and save new PIN
    const newPinHash = await bcrypt.hash(newPin, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: newPinHash }
    })

    return NextResponse.json({ success: true, message: 'PIN berhasil diubah' })
  } catch (error) {
    console.error('Change PIN error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
