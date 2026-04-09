import { NextRequest, NextResponse } from "next/server";
import { type ApprovalAction } from "@/generated/prisma/client";
import { decideLeaveRequest } from "@/lib/data/leave";
import { db } from "@/lib/db";
import {
  notifyLeaveApproved,
  notifyLeaveRejected,
} from "@/lib/notifications";
import { leaveDecisionSchema } from "@/lib/schemas/leave";
import { getSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  const sessionUser = await getSession(request);
  if (!sessionUser || !["manager", "hr_admin"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = leaveDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid approval payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { requestId } = await context.params;

  try {
    const leaveRequest = await decideLeaveRequest(
      sessionUser.sub,
      requestId,
      {
        action: parsed.data.action as ApprovalAction,
        comment: parsed.data.comment,
      },
      sessionUser.role
    );

    const employee = await db.user.findUnique({
      where: { id: leaveRequest.userId },
      select: { id: true },
    });

    const leaveType = await db.leaveType.findUnique({
      where: { id: leaveRequest.leaveTypeId },
      select: { name: true },
    });

    if (employee && leaveType) {
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString("en-IN");
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString("en-IN");

      if (parsed.data.action === "approved") {
        notifyLeaveApproved({
            employeeId: employee.id,
            leaveType: leaveType.name,
            startDate,
            endDate,
        }).catch(err => console.error("Notify err:", err));
    }

    if (parsed.data.action === "rejected") {
        notifyLeaveRejected({
            employeeId: employee.id,
            leaveType: leaveType.name,
            startDate,
            endDate,
            reason: parsed.data.comment ?? undefined,
        }).catch(err => console.error("Notify err:", err));
    }
    }

    return NextResponse.json({ ok: true, leaveRequest });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the leave request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}