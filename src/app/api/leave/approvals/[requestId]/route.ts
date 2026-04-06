import { NextRequest, NextResponse } from "next/server";
import { type ApprovalAction } from "@/generated/prisma/client";
import { decideLeaveRequest } from "@/lib/data/leave";
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

        return NextResponse.json({ ok: true, leaveRequest });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update the leave request.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
