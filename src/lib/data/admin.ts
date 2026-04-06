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
