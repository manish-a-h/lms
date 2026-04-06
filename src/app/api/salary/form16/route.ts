import { NextRequest, NextResponse } from "next/server";
import { getForm16Data } from "@/lib/data/salary";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const sessionUser = await getSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const startYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear() - 1;

  if (isNaN(startYear) || startYear < 2000 || startYear > 2100) {
    return NextResponse.json({ error: "Invalid year parameter." }, { status: 400 });
  }

  try {
    const data = await getForm16Data(sessionUser.sub, startYear);
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Form-16 data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
