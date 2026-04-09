import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  const pendingRequests = await db.leaveRequest.findMany({
    where: {
      status: 'pending',
      appliedOn: {
        lte: twoDaysAgo,
      },
    },
    include: {
      user: true,
      leaveType: true,
    },
  })

  let notified = 0

  for (const request of pendingRequests) {
    const assignment = await db.teamAssignment.findFirst({
      where: {
        employeeId: request.userId,
        active: true,
      },
      select: {
        managerId: true,
      },
    })

    if (!assignment?.managerId) continue

    await createNotification({
      userId: assignment.managerId,
      type: 'LEAVE_REMINDER',
      title: 'Pending Leave Approval Reminder',
      message: `${request.user.name}'s ${request.leaveType.name} request is still pending approval.`,
      link: '/leave/approvals',
    })

    notified++
  }

  return NextResponse.json({
    success: true,
    processed: pendingRequests.length,
    notified,
  })
}