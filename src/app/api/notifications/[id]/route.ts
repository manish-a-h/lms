import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { markAsRead } from '@/lib/notifications'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const result = await markAsRead(id, session.sub)

  if (result.count > 0) {
    return NextResponse.json({ success: true, count: result.count })
  }
  
  return NextResponse.json(
    { success: false, message: 'No notification found or already read' },
    { status: 404 }
  )
}