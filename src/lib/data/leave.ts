import { db } from "../db";

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
      status: "approved",
      startDate: { gte: today },
    },
    orderBy: { startDate: "asc" },
    take: 5,
    include: { leaveType: true },
  });
}

export async function getPendingLeaveRequests(managerId?: string) {
  return db.leaveRequest.findMany({
    where: { status: "pending" },
    orderBy: { appliedOn: "asc" },
    include: { leaveType: true, user: { select: { id: true, name: true, department: true } } },
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
