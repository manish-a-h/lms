import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
} from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const session = await getSession(req)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const countOnly = searchParams.get('count') === 'true'

  if (countOnly) {
    const count = await getUnreadCount(session.sub)
    return NextResponse.json({ count })
  }

  const notifications = await getUserNotifications(session.sub)
  return NextResponse.json({ notifications })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await markAllAsRead(session.sub)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}