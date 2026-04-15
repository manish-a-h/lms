import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password sign in is disabled. Use Microsoft Teams to access this portal." },
    { status: 403 }
  );
}
