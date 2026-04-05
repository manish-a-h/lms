import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, hashToken, verifyTokenHash } from "@/lib/auth";
import { accessTokenCookieOptions } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Verify JWT
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    // Find matching, non-revoked token in DB
    const storedTokens = await db.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    const matched = await Promise.all(
      storedTokens.map((t) => verifyTokenHash(refreshToken, t.tokenHash).then((ok) => (ok ? t : null)))
    ).then((results) => results.find(Boolean));

    if (!matched) {
      return NextResponse.json({ error: "Refresh token revoked or not found" }, { status: 401 });
    }

    // Issue new access token
    const newAccessToken = await signAccessToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("access_token", newAccessToken, accessTokenCookieOptions());
    return response;
  } catch (error) {
    console.error("[REFRESH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
