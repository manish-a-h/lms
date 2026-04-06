import { NextRequest, NextResponse } from "next/server";
import { getSalarySlipDetail } from "@/lib/data/salary";
import { getSession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slipId: string }> }
) {
  const sessionUser = await getSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slipId } = await context.params;

  try {
    const slip = await getSalarySlipDetail(sessionUser.sub, slipId);
    if (!slip) {
      return NextResponse.json({ error: "Salary slip not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, slip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load salary slip.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
