import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { LeaveStatus, ApprovalAction } from "@/generated/prisma/client";
import {
    notifyLeaveApproved,
    notifyLeaveRejected,
} from "@/lib/notifications";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionUser = await getSession(request);
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (sessionUser.role !== "hr_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const { action, comments } = await request.json();

        if (action !== "approve" && action !== "reject") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const statusMap = {
            approve: LeaveStatus.approved,
            reject: LeaveStatus.rejected,
        };

        const approvalActionMap = {
            approve: ApprovalAction.approved,
            reject: ApprovalAction.rejected,
        };

        const targetRequest = await db.leaveRequest.findUnique({ where: { id } });
        if (!targetRequest) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Wrap in transaction just as a best practice, mimicking the standard approval flow
        const updatedRequest = await db.$transaction(async (tx) => {
            // 1. Log the approval action
            await tx.approvalLog.create({
                data: {
                    requestId: id,
                    managerId: sessionUser.sub,
                    action: approvalActionMap[action as keyof typeof approvalActionMap],
                    comment: comments || `HR Admin ${action}d request from calendar`,
                },
            });

            // 2. Update the leave request itself
            const req = await tx.leaveRequest.update({
                where: { id },
                data: { status: statusMap[action as keyof typeof statusMap] },
            });

            // 3. Log activity
            await tx.activityLog.create({
                data: {
                    actorId: sessionUser.sub,
                    action: `Leave ${action}d`,
                    entityType: "LeaveRequest",
                    entityId: id,
                    message: `HR Admin resolved leave request via Calendar`,
                },
            });

            return req;
        });

        // Send notification to the employee
        const employee = await db.user.findUnique({
            where: { id: targetRequest.userId },
            select: { id: true, name: true },
        });
        const leaveType = await db.leaveType.findUnique({
            where: { id: targetRequest.leaveTypeId },
            select: { name: true },
        });

        if (employee && leaveType) {
            const startDate = new Date(targetRequest.startDate).toLocaleDateString("en-IN");
            const endDate = new Date(targetRequest.endDate).toLocaleDateString("en-IN");

            if (action === "approve") {
                notifyLeaveApproved({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    leaveType: leaveType.name,
                    startDate,
                    endDate,
                }).catch(err => console.error("Notify err:", err));
            }

            if (action === "reject") {
                notifyLeaveRejected({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    leaveType: leaveType.name,
                    startDate,
                    endDate,
                    reason: comments ?? undefined,
                }).catch(err => console.error("Notify err:", err));
            }
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Leave Action API Error:", error);
        return NextResponse.json({ error: "Failed to process leave action" }, { status: 500 });
    }
}
