import { NextRequest, NextResponse } from "next/server";
import { getSalarySlips } from "@/lib/data/salary";
import { salarySlipFilterSchema } from "@/lib/schemas/salary";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const sessionUser = await getSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = salarySlipFilterSchema.safeParse({
    year: searchParams.get("year") ?? undefined,
    month: searchParams.get("month") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid filter." },
      { status: 400 }
    );
  }

  try {
    const slips = await getSalarySlips(sessionUser.sub, parsed.data.year, parsed.data.month);
    return NextResponse.json({ ok: true, slips });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load salary slips.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
