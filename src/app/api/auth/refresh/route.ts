import { NextRequest, NextResponse } from "next/server";
import { TokenPurpose } from "@/generated/prisma/client";
import { signAccessToken, verifyRefreshToken, verifyTokenHash } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const storedToken = await db.refreshToken.findFirst({
      where: {
        id: payload.jti,
        userId: payload.sub,
        purpose: TokenPurpose.session,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        tokenHash: true,
      },
    });

    if (!storedToken) {
      return NextResponse.json({ error: "Refresh token revoked or not found" }, { status: 401 });
    }

    const isMatch = await verifyTokenHash(refreshToken, storedToken.tokenHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Refresh token revoked or not found" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "User account is inactive" }, { status: 403 });
    }

    const newAccessToken = await signAccessToken({
      sub: user.id,
      jti: storedToken.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("access_token", newAccessToken, accessTokenCookieOptions());
    response.cookies.set("refresh_token", refreshToken, refreshTokenCookieOptions());
    return response;
  } catch (error) {
    console.error("[REFRESH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
