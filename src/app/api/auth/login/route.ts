import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/data/users";
import { verifyPassword, signAccessToken, signRefreshToken, hashToken } from "@/lib/auth";
import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ]);

    // Store hashed refresh token in DB
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7)
    );

    await db.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set("access_token", accessToken, accessTokenCookieOptions());
    response.cookies.set("refresh_token", refreshToken, refreshTokenCookieOptions());

    return response;
  } catch (error) {
    console.error("[LOGIN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
