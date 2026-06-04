import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const { userId, name, email, theme, language, avatarUrl } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (theme !== undefined) updateData.theme = theme
    if (language !== undefined) updateData.language = language
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      user: {
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
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
