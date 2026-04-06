import { NextRequest, NextResponse } from "next/server";
import { getSalaryComponents } from "@/lib/data/salary";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const sessionUser = await getSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const components = await getSalaryComponents(sessionUser.sub);
    return NextResponse.json({ ok: true, ...components });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
