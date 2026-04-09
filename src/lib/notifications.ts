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

// ─── Core CRUD ────────────────────────────────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({ data: input })
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
  } catch (err) {
    console.error('Failed to notify leave submitted: ', err)
  }
}

export async function notifyLeaveApproved(params: {
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
}) {
  try {
    await createNotification({
      userId: params.employeeId,
      type: 'LEAVE_APPROVED',
      title: 'Leave Approved ✓',
      message: `Your ${params.leaveType} leave from ${params.startDate} to ${params.endDate} has been approved.`,
      link: '/leave/history',
    })
  } catch (err) { console.error('Failed to notify leave approved: ', err) }
}

export async function notifyLeaveRejected(params: {
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
}) {
  try {
    await createNotification({
      userId: params.employeeId,
      type: 'LEAVE_REJECTED',
      title: 'Leave Not Approved',
      message: `Your ${params.leaveType} leave from ${params.startDate} to ${params.endDate} was not approved${
        params.reason ? `: ${params.reason}` : '.'
      }`,
      link: '/leave/history',
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
  } catch (err) { console.error('Failed to notify leave cancelled: ', err) }
}