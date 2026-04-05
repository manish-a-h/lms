import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, verifyTokenHash } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);

        // Revoke all refresh tokens for this user
        await db.refreshToken.updateMany({
          where: { userId: payload.sub, revoked: false },
          data: { revoked: true },
        });
      } catch {
        // Token invalid — still clear cookies
      }
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    console.error("[LOGOUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
