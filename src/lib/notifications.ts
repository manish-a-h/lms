import { db } from '@/lib/db'
import { NotificationType } from '@/generated/prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

type HrAlertRecipient = {
  id: string
  email: string
  name: string
}

// ─── Core CRUD ────────────────────────────────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({ data: input })
}

async function getActiveHrAdmins(): Promise<HrAlertRecipient[]> {
  return db.user.findMany({
    where: {
      role: 'hr_admin',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })
}

async function sendTeamsHrAlert(params: {
  title: string
  message: string
  link?: string
  recipients: HrAlertRecipient[]
}) {
  const webhookUrl = process.env.TEAMS_HR_WEBHOOK_URL?.trim()
  if (!webhookUrl || params.recipients.length === 0) {
    return
  }

  const appUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ''

  const fullLink = params.link ? `${appUrl}${params.link}` : ''

  const payload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: params.title,
    themeColor: '004ac6',
    title: params.title,
    text: fullLink
      ? `${params.message}\n\n[Open in HRMS](${fullLink})`
      : params.message,
    sections: [
      {
        markdown: true,
        facts: [
          {
            name: 'HR Recipients',
            value: params.recipients.map((recipient) => recipient.email).join(', '),
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.warn('[teams-hr-alerts] Teams webhook returned', response.status)
    }
  } catch (err) {
    console.error('[teams-hr-alerts] Failed to post Teams notification:', err)
  }
}

async function notifyHrAdmins(params: {
  type: NotificationType
  title: string
  message: string
  link?: string
  excludeUserIds?: string[]
}) {
  const hrAdmins = await getActiveHrAdmins()
  const excludedUserIds = new Set(params.excludeUserIds ?? [])
  const recipients = hrAdmins.filter((recipient) => !excludedUserIds.has(recipient.id))

  if (recipients.length === 0) {
    return
  }

  await Promise.all(
    recipients.map((recipient) =>
      createNotification({
        userId: recipient.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      })
    )
  )

  await sendTeamsHrAlert({
    title: params.title,
    message: params.message,
    link: params.link,
    recipients,
  })
}

export async function getUserNotifications(userId: string, take = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { userId, isRead: false },
  })
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true },
  })
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

// ─── Event Triggers ───────────────────────────────────────────────────────────

export async function notifyLeaveSubmitted(params: {
  employeeId: string
  managerId: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
}) {
  try {
    await db.$transaction([
      db.notification.create({
        data: {
          userId: params.employeeId,
          type: 'LEAVE_SUBMITTED',
          title: 'Leave Application Submitted',
          message: `Your ${params.leaveType} leave from ${params.startDate} to ${params.endDate} has been submitted for approval.`,
          link: '/leave/history',
        }
      }),
      db.notification.create({
        data: {
          userId: params.managerId,
          type: 'LEAVE_SUBMITTED',
          title: 'New Leave Request',
          message: `${params.employeeName} has applied for ${params.leaveType} leave from ${params.startDate} to ${params.endDate}.`,
          link: '/leave/approvals',
        }
      }),
    ])

    await notifyHrAdmins({
      type: 'LEAVE_SUBMITTED',
      title: 'HR Alert: New Leave Request',
      message: `${params.employeeName} has applied for ${params.leaveType} leave from ${params.startDate} to ${params.endDate}.`,
      link: '/admin',
      excludeUserIds: [params.employeeId, params.managerId],
    })
  } catch (err) {
    console.error('Failed to notify leave submitted: ', err)
  }
}

export async function notifyLeaveApproved(params: {
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  employeeName?: string
}) {
  try {
    await createNotification({
      userId: params.employeeId,
      type: 'LEAVE_APPROVED',
      title: 'Leave Approved ✓',
      message: `Your ${params.leaveType} leave from ${params.startDate} to ${params.endDate} has been approved.`,
      link: '/leave/history',
    })

    await notifyHrAdmins({
      type: 'LEAVE_APPROVED',
      title: 'HR Alert: Leave Approved',
      message: `${params.employeeName ?? 'An employee'} had ${params.leaveType} leave approved for ${params.startDate} to ${params.endDate}.`,
      link: '/admin',
      excludeUserIds: [params.employeeId],
    })
  } catch (err) { console.error('Failed to notify leave approved: ', err) }
}

export async function notifyLeaveRejected(params: {
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
  employeeName?: string
}) {
  try {
    await createNotification({
      userId: params.employeeId,
      type: 'LEAVE_REJECTED',
      title: 'Leave Not Approved',
      message: `Your ${params.leaveType} leave from ${params.startDate} to ${params.endDate} was not approved${params.reason ? `: ${params.reason}` : '.'
        }`,
      link: '/leave/history',
    })

    await notifyHrAdmins({
      type: 'LEAVE_REJECTED',
      title: 'HR Alert: Leave Rejected',
      message: `${params.employeeName ?? 'An employee'} had ${params.leaveType} leave rejected for ${params.startDate} to ${params.endDate}${params.reason ? ` (${params.reason})` : '.'}`,
      link: '/admin',
      excludeUserIds: [params.employeeId],
    })
  } catch (err) { console.error('Failed to notify leave rejected: ', err) }
}

export async function notifyLeaveCancelled(params: {
  managerId: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
}) {
  try {
    await createNotification({
      userId: params.managerId,
      type: 'LEAVE_CANCELLED',
      title: 'Leave Cancelled',
      message: `${params.employeeName} cancelled their ${params.leaveType} leave request (${params.startDate} – ${params.endDate}).`,
      link: '/leave/approvals',
    })

    await notifyHrAdmins({
      type: 'LEAVE_CANCELLED',
      title: 'HR Alert: Leave Cancelled',
      message: `${params.employeeName} cancelled a ${params.leaveType} leave request for ${params.startDate} to ${params.endDate}.`,
      link: '/admin',
      excludeUserIds: [params.managerId],
    })
  } catch (err) { console.error('Failed to notify leave cancelled: ', err) }
}