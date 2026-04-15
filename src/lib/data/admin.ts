import { Role } from "@/generated/prisma/client";
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

export async function getApprovedTeamsEmails() {
    return db.approvedEmail.findMany({
        orderBy: [
            { isActive: "desc" },
            { email: "asc" },
        ],
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });
}

export async function upsertApprovedTeamsEmail(input: {
    email: string;
    role: Role;
    actorId?: string;
}) {
    const email = input.email.trim().toLowerCase();

    return db.$transaction(async (tx) => {
        const approvedEmail = await tx.approvedEmail.upsert({
            where: { email },
            update: {
                role: input.role,
                isActive: true,
            },
            create: {
                email,
                role: input.role,
                isActive: true,
            },
        });

        const existingUser = await tx.user.findFirst({
            where: {
                OR: [
                    { email },
                    { nitteEmail: email },
                ],
            },
            select: { id: true },
        });

        if (existingUser) {
            await tx.user.update({
                where: { id: existingUser.id },
                data: {
                    email,
                    nitteEmail: null,
                    role: input.role,
                    isActive: true,
                },
            });
        }

        if (input.actorId) {
            await tx.activityLog.create({
                data: {
                    actorId: input.actorId,
                    action: "access.approved-email.upsert",
                    entityType: "ApprovedEmail",
                    entityId: approvedEmail.id,
                    message: `Approved ${email} for Teams login as ${input.role}.`,
                },
            });
        }

        return approvedEmail;
    });
}

export async function setApprovedTeamsEmailStatus(input: {
    id: string;
    isActive: boolean;
    actorId?: string;
}) {
    return db.$transaction(async (tx) => {
        const approvedEmail = await tx.approvedEmail.update({
            where: { id: input.id },
            data: { isActive: input.isActive },
        });

        if (input.actorId) {
            await tx.activityLog.create({
                data: {
                    actorId: input.actorId,
                    action: input.isActive ? "access.approved-email.enabled" : "access.approved-email.disabled",
                    entityType: "ApprovedEmail",
                    entityId: approvedEmail.id,
                    message: `${input.isActive ? "Enabled" : "Disabled"} Teams access for ${approvedEmail.email}.`,
                },
            });
        }

        return approvedEmail;
    });
}

export async function updateManagedUserRole(input: {
    userId: string;
    role: Role;
    actorId?: string;
}) {
    return db.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: input.userId },
            data: { role: input.role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        await tx.approvedEmail.upsert({
            where: { email: updatedUser.email.trim().toLowerCase() },
            update: {
                role: input.role,
                isActive: true,
            },
            create: {
                email: updatedUser.email.trim().toLowerCase(),
                role: input.role,
                isActive: true,
            },
        });

        if (input.actorId) {
            await tx.activityLog.create({
                data: {
                    actorId: input.actorId,
                    action: "user.role.updated",
                    entityType: "User",
                    entityId: updatedUser.id,
                    message: `Changed ${updatedUser.email} role to ${input.role}.`,
                },
            });
        }

        return updatedUser;
    });
}

export async function getAdminOverview() {
    const currentYear = new Date().getFullYear();

    const [userPage, leaveTypes, holidays, pendingApprovals, recentActivity, activeUsersCount, approvedEmails] =
        await Promise.all([
            getAllUsers(1, 50),
            getLeaveTypes(),
            getHolidays(currentYear),
            getPendingLeaveRequests(),
            getRecentActivityLog(8),
            db.user.count({ where: { isActive: true } }),
            getApprovedTeamsEmails(),
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
        approvedEmails,
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
