import { NextRequest, NextResponse } from "next/server";
import { type DayTime } from "@/generated/prisma/client";
import { createLeaveRequestForUser } from "@/lib/data/leave";
import { db } from "@/lib/db";
import { notifyLeaveSubmitted } from "@/lib/notifications";
import { createLeaveRequestSchema } from "@/lib/schemas/leave";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const sessionUser = await getSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = createLeaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid leave request.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const leaveRequest = await createLeaveRequestForUser(sessionUser.sub, {
      leaveTypeId: parsed.data.leaveTypeId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      dayTime: parsed.data.dayTime as DayTime,
      reason: parsed.data.reason,
      dutyIncharge: parsed.data.dutyIncharge,
    });

    const employee = await db.user.findUnique({
      where: { id: sessionUser.sub },
      select: { id: true, name: true },
    });

    const leaveType = await db.leaveType.findUnique({
      where: { id: parsed.data.leaveTypeId },
      select: { name: true },
    });

    const assignment = await db.teamAssignment.findFirst({
      where: { employeeId: sessionUser.sub },
      select: { managerId: true },
    });

    if (employee && leaveType && assignment?.managerId) {
      await notifyLeaveSubmitted({
        employeeId: employee.id,
        managerId: assignment.managerId,
        employeeName: employee.name,
        leaveType: leaveType.name,
        startDate: new Date(parsed.data.startDate).toLocaleDateString("en-IN"),
        endDate: new Date(parsed.data.endDate).toLocaleDateString("en-IN"),
      });
    }

    return NextResponse.json({ ok: true, leaveRequest }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit the leave request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}