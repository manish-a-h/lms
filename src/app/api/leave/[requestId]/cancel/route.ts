import { NextRequest, NextResponse } from "next/server";
import { cancelLeaveRequestForUser } from "@/lib/data/leave";
import { db } from "@/lib/db";
import { notifyLeaveCancelled } from "@/lib/notifications";
import { getSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  const sessionUser = await getSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await context.params;

  try {
    const leaveRequest = await cancelLeaveRequestForUser(sessionUser.sub, requestId);

    const employee = await db.user.findUnique({
      where: { id: sessionUser.sub },
      select: { name: true },
    });

    const assignment = await db.teamAssignment.findFirst({
      where: { employeeId: sessionUser.sub },
      select: { managerId: true },
    });

    const leaveType = await db.leaveType.findUnique({
      where: { id: leaveRequest.leaveTypeId },
      select: { name: true },
    });

    if (employee && assignment?.managerId && leaveType) {
      await notifyLeaveCancelled({
        managerId: assignment.managerId,
        employeeName: employee.name,
        leaveType: leaveType.name,
        startDate: new Date(leaveRequest.startDate).toLocaleDateString("en-IN"),
        endDate: new Date(leaveRequest.endDate).toLocaleDateString("en-IN"),
      });
    }

    return NextResponse.json({ ok: true, leaveRequest });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel this leave request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}