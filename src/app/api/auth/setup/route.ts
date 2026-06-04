import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN harus 6 digit angka' }, { status: 400 })
    }

    // In this simulator, we just grab the first user (John Doe) and update their PIN.
    const user = await prisma.user.findFirst()
    
    if (!user) {
      return NextResponse.json({ error: 'No user found in database. Run seed first.' }, { status: 404 })
    }

    const pinHash = await bcrypt.hash(pin, 10)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        pinHash,
        isOnboarded: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      userId: updatedUser.id,
      name: updatedUser.name
    })

  } catch (error) {
    console.error('Setup PIN error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
