import { db } from "../db";
import { getHolidays, getLeaveTypes, getPendingLeaveRequests } from "./leave";
import { getAllUsers } from "./users";

export async function getRecentActivityLog(limit = 8) {
    return db.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
}

export async function getAdminOverview() {
    const currentYear = new Date().getFullYear();

    const [userPage, leaveTypes, holidays, pendingApprovals, recentActivity, activeUsersCount] =
        await Promise.all([
            getAllUsers(1, 6),
            getLeaveTypes(),
            getHolidays(currentYear),
            getPendingLeaveRequests(),
            getRecentActivityLog(8),
            db.user.count({ where: { isActive: true } }),
        ]);

    return {
        currentYear,
        users: userPage.users,
        totalUsers: userPage.total,
        activeUsersCount,
        leaveTypes,
        holidays,
        pendingApprovals,
        recentActivity,
    };
}

export async function getCalendarData(year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const [leaves, holidays, activeUsersCount] = await Promise.all([
        db.leaveRequest.findMany({
            where: {
                startDate: { lte: endOfMonth },
                endDate: { gte: startOfMonth },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        department: true,
                        designation: true,
                    },
                },
                leaveType: true,
            },
            orderBy: { startDate: "asc" },
        }),
        db.holiday.findMany({
            where: {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            orderBy: { date: "asc" },
        }),
        db.user.count({ where: { isActive: true } }),
    ]);

    return {
        leaves,
        holidays,
        activeUsersCount,
    };
}
