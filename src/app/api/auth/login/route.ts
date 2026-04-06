import { NextRequest, NextResponse } from "next/server";
import { TokenPurpose } from "@/generated/prisma/client";
import {
  createSessionTokenId,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/data/users";
import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const parsedBody = body as { email?: unknown; password?: unknown };
  const email =
    typeof parsedBody.email === "string" ? parsedBody.email.trim().toLowerCase() : "";
  const password = typeof parsedBody.password === "string" ? parsedBody.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const user = await getUserByEmail(email);

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const sessionTokenId = createSessionTokenId();
    const payload = {
      sub: user.id,
      jti: sessionTokenId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ]);

    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7)
    );

    await db.refreshToken.create({
      data: {
        id: sessionTokenId,
        userId: user.id,
        tokenHash,
        purpose: TokenPurpose.session,
        expiresAt,
      },
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
