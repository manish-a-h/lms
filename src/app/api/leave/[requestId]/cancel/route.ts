import { NextRequest, NextResponse } from "next/server";
import { cancelLeaveRequestForUser } from "@/lib/data/leave";
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
        return NextResponse.json({ ok: true, leaveRequest });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to cancel this leave request.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
