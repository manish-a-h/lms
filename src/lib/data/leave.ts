import {
  ApprovalAction,
  DayTime,
  LeaveStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { db } from "../db";
import { calculateLeaveDays, enumerateDatesInRange, formatDateKey, isWeekend, parseLocalDateInput } from "../utils";

const DEFAULT_PAGE_SIZE = 10;

export async function getLeaveTypes() {
  return db.leaveType.findMany({ orderBy: { name: "asc" } });
}

export async function getLeaveBalances(userId: string, year: number) {
  return db.leaveBalance.findMany({
    where: { userId, year },
    include: { leaveType: true },
    orderBy: { leaveType: { name: "asc" } },
  });
}

export async function getRecentLeaveRequests(userId: string, limit = 5) {
  return db.leaveRequest.findMany({
    where: { userId },
    orderBy: { appliedOn: "desc" },
    take: limit,
    include: { leaveType: true },
  });
}

export async function getUpcomingApprovedLeaves(userId: string) {
  const today = new Date();
  return db.leaveRequest.findMany({
    where: {
      userId,
      status: LeaveStatus.approved,
      startDate: { gte: today },
    },
    orderBy: { startDate: "asc" },
    take: 5,
    include: { leaveType: true },
  });
}

export async function getUserLeaveHistory(
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  status?: LeaveStatus
) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 50) : DEFAULT_PAGE_SIZE;
  const skip = (safePage - 1) * safePageSize;

  const where: Prisma.LeaveRequestWhereInput = {
    userId,
    ...(status ? { status } : {}),
  };

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: { leaveType: true, approvalLogs: true },
      orderBy: { appliedOn: "desc" },
      skip,
      take: safePageSize,
    }),
    db.leaveRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    page: safePage,
    pageSize: safePageSize,
  };
}

export async function getLeaveOverview(userId: string, year: number) {
  const [leaveTypes, balances, requests] = await Promise.all([
    getLeaveTypes(),
    getLeaveBalances(userId, year),
    db.leaveRequest.findMany({
      where: {
        userId,
        startDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: {
        id: true,
        leaveTypeId: true,
        noOfDays: true,
        status: true,
      },
    }),
  ]);

  const balanceCards = leaveTypes.map((leaveType) => {
    const balance = balances.find((entry) => entry.leaveTypeId === leaveType.id);
    const total = balance?.totalDays ?? leaveType.maxDaysPerYear;
    const used = balance?.usedDays ?? 0;
    const pending = requests
      .filter(
        (request) =>
          request.leaveTypeId === leaveType.id && request.status === LeaveStatus.pending
      )
      .reduce((sum, request) => sum + request.noOfDays, 0);

    return {
      id: leaveType.id,
      name: leaveType.name,
      total,
      used,
      pending,
      remaining: Math.max(total - used, 0),
      description: leaveType.description,
    };
  });

  return {
    balanceCards,
    pendingCount: requests.filter((request) => request.status === LeaveStatus.pending).length,
    approvedCount: requests.filter((request) => request.status === LeaveStatus.approved).length,
  };
}

export async function getPendingLeaveRequests(managerId?: string) {
  return db.leaveRequest.findMany({
    where: {
      status: LeaveStatus.pending,
      ...(managerId
        ? {
          user: {
            employeeAssignments: {
              some: {
                managerId,
                active: true,
              },
            },
          },
        }
        : {}),
    },
    orderBy: { appliedOn: "asc" },
    include: {
      leaveType: true,
      user: {
        select: {
          id: true,
          name: true,
          department: true,
          designation: true,
        },
      },
    },
  });
}

export async function getTeamConflictWarnings(
  managerId?: string,
  startDate = new Date(),
  endDate = new Date(new Date().setDate(new Date().getDate() + 30))
) {
  const requests = await db.leaveRequest.findMany({
    where: {
      status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(managerId
        ? {
          user: {
            employeeAssignments: {
              some: {
                managerId,
                active: true,
              },
            },
          },
        }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      leaveType: { select: { name: true } },
    },
  });

  const conflictMap = new Map<string, Set<string>>();

  for (const request of requests) {
    const dates = enumerateDatesInRange(
      parseLocalDateInput(request.startDate),
      parseLocalDateInput(request.endDate)
    ).filter((date) => !isWeekend(date));

    for (const date of dates) {
      const key = formatDateKey(date);
      const existing = conflictMap.get(key) ?? new Set<string>();
      existing.add(request.userId);
      conflictMap.set(key, existing);
    }
  }

  return Array.from(conflictMap.entries())
    .filter(([, users]) => users.size >= 3)
    .map(([date, users]) => ({ date, count: users.size }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function createLeaveRequestForUser(
  userId: string,
  input: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    dayTime: DayTime;
    reason: string;
    dutyIncharge?: string;
  }
) {
  const startDate = parseLocalDateInput(input.startDate);
  const endDate = parseLocalDateInput(input.endDate);

  const [leaveType, holidays, overlappingRequest, balance] = await Promise.all([
    db.leaveType.findUnique({ where: { id: input.leaveTypeId } }),
    db.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { date: true },
    }),
    db.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    }),
    db.leaveBalance.findUnique({
      where: {
        userId_leaveTypeId_year: {
          userId,
          leaveTypeId: input.leaveTypeId,
          year: startDate.getFullYear(),
        },
      },
    }),
  ]);

  if (!leaveType) {
    throw new Error("The selected leave type no longer exists.");
  }

  if (overlappingRequest) {
    throw new Error("You already have a pending or approved leave during this date range.");
  }

  const noOfDays = calculateLeaveDays({
    startDate,
    endDate,
    dayTime: input.dayTime,
    holidays: holidays.map((holiday) => holiday.date),
  });

  if (noOfDays <= 0) {
    throw new Error("Please choose working days only for your leave request.");
  }

  const totalAllowedDays = balance?.totalDays ?? leaveType.maxDaysPerYear;
  const usedDays = balance?.usedDays ?? 0;

  if (usedDays + noOfDays > totalAllowedDays) {
    throw new Error(
      `This request exceeds your available ${leaveType.name.toLowerCase()} balance.`
    );
  }

  return db.$transaction(async (tx) => {
    const request = await tx.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: input.leaveTypeId,
        startDate,
        endDate,
        dayTime: input.dayTime,
        noOfDays,
        reason: input.reason.trim(),
        dutyIncharge: input.dutyIncharge?.trim() || null,
        status: LeaveStatus.pending,
      },
      include: { leaveType: true },
    });

    await tx.activityLog.create({
      data: {
        actorId: userId,
        action: "leave.request.submitted",
        entityType: "LeaveRequest",
        entityId: request.id,
        message: `Submitted a ${request.leaveType.name} request for ${request.noOfDays} day(s).`,
        metadata: {
          dayTime: request.dayTime,
          startDate: request.startDate.toISOString(),
          endDate: request.endDate.toISOString(),
        },
      },
    });

    return request;
  });
}

export async function cancelLeaveRequestForUser(userId: string, requestId: string) {
  const existingRequest = await db.leaveRequest.findFirst({
    where: {
      id: requestId,
      userId,
      status: LeaveStatus.pending,
    },
    include: { leaveType: true },
  });

  if (!existingRequest) {
    throw new Error("Only your pending leave requests can be cancelled.");
  }

  return db.$transaction(async (tx) => {
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.cancelled,
        comments: "Cancelled by employee.",
      },
      include: { leaveType: true },
    });

    await tx.activityLog.create({
      data: {
        actorId: userId,
        action: "leave.request.cancelled",
        entityType: "LeaveRequest",
        entityId: requestId,
        message: `Cancelled a pending ${updatedRequest.leaveType.name} request.`,
      },
    });

    return updatedRequest;
  });
}

export async function decideLeaveRequest(
  managerId: string,
  requestId: string,
  decision: {
    action: ApprovalAction;
    comment?: string;
  },
  actorRole: string = "manager"
) {
  const leaveRequest = await db.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true } },
      leaveType: true,
    },
  });

  if (!leaveRequest || leaveRequest.status !== LeaveStatus.pending) {
    throw new Error("This leave request is no longer pending approval.");
  }

  if (actorRole !== "hr_admin") {
    const assignment = await db.teamAssignment.findFirst({
      where: {
        managerId,
        employeeId: leaveRequest.userId,
        active: true,
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new Error("You can only act on requests for employees assigned to your team.");
    }
  }

  const nextStatus =
    decision.action === ApprovalAction.approved
      ? LeaveStatus.approved
      : LeaveStatus.rejected;

  return db.$transaction(async (tx) => {
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        comments: decision.comment?.trim() || leaveRequest.comments,
      },
      include: { leaveType: true, user: true },
    });

    await tx.approvalLog.create({
      data: {
        requestId,
        managerId,
        action: decision.action,
        comment: decision.comment?.trim() || null,
      },
    });

    if (decision.action === ApprovalAction.approved) {
      const balanceYear = leaveRequest.startDate.getFullYear();
      await tx.leaveBalance.upsert({
        where: {
          userId_leaveTypeId_year: {
            userId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: balanceYear,
          },
        },
        update: {
          usedDays: {
            increment: leaveRequest.noOfDays,
          },
        },
        create: {
          userId: leaveRequest.userId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year: balanceYear,
          totalDays: leaveRequest.leaveType.maxDaysPerYear,
          usedDays: leaveRequest.noOfDays,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        actorId: managerId,
        action: `leave.request.${nextStatus}`,
        entityType: "LeaveRequest",
        entityId: requestId,
        message: `${decision.action === ApprovalAction.approved ? "Approved" : "Rejected"} ${leaveRequest.user.name}'s ${leaveRequest.leaveType.name} request.`,
        metadata: {
          comment: decision.comment?.trim() || null,
        },
      },
    });

    return updatedRequest;
  });
}

export async function getHolidays(year: number) {
  return db.holiday.findMany({
    where: {
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    orderBy: { date: "asc" },
  });
}
