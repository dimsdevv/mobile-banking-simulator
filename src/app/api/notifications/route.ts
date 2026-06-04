import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Using raw SQL to bypass Prisma generation lock
    const rawNotifications = await prisma.$queryRaw<any[]>`
      SELECT * FROM notifications 
      WHERE userId = ${userId} 
      ORDER BY createdAt DESC 
      LIMIT 20
    `

    const notifications = rawNotifications.map(n => ({
      ...n,
      isRead: n.isRead === 1 || n.isRead === true
    }))

    const unreadCount = notifications.filter(n => !n.isRead).length

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, notificationId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (notificationId) {
      // Mark specific notification as read using raw SQL
      await prisma.$executeRaw`UPDATE notifications SET isRead = 1 WHERE id = ${notificationId}`
    } else {
      // Mark all as read using raw SQL
      await prisma.$executeRaw`UPDATE notifications SET isRead = 1 WHERE userId = ${userId} AND isRead = 0`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
