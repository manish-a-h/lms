import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyTokenHash } from "@/lib/auth";
import { updateUserPassword } from "@/lib/data/users";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { token, userId, password } = await request.json() as {
      token: string;
      userId: string;
      password: string;
    };

    if (!token || !userId || !password) {
      return NextResponse.json(
        { error: "Token, userId, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find a valid, non-revoked token for this user
    const storedTokens = await db.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    const matched = await Promise.all(
      storedTokens.map(async (t) => {
        const ok = await verifyTokenHash(token, t.tokenHash);
        return ok ? t : null;
      })
    ).then((results) => results.find(Boolean));

    if (!matched) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Update password and revoke the token
    const newHash = await hashPassword(password);
    await Promise.all([
      updateUserPassword(userId, newHash),
      db.refreshToken.update({ where: { id: matched.id }, data: { revoked: true } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[RESET-PASSWORD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
