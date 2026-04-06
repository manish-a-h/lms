import { NextRequest, NextResponse } from "next/server";
import { TokenPurpose } from "@/generated/prisma/client";
import { hashPassword, verifyTokenHash } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Token, userId, and password are required" },
      { status: 400 }
    );
  }

  const parsedBody = body as {
    token?: unknown;
    userId?: unknown;
    password?: unknown;
  };

  const token = typeof parsedBody.token === "string" ? parsedBody.token : "";
  const userId = typeof parsedBody.userId === "string" ? parsedBody.userId : "";
  const password = typeof parsedBody.password === "string" ? parsedBody.password : "";

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

  try {
    const storedTokens = await db.refreshToken.findMany({
      where: {
        userId,
        purpose: TokenPurpose.reset,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        tokenHash: true,
      },
    });

    const matched = await Promise.all(
      storedTokens.map(async (storedToken: { id: string; tokenHash: string }) => {
        const isMatch = await verifyTokenHash(token, storedToken.tokenHash);
        return isMatch ? storedToken : null;
      })
    ).then((results) => results.find(Boolean));

    if (!matched) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(password);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      await tx.refreshToken.update({
        where: { id: matched.id },
        data: { revoked: true },
      });

      await tx.refreshToken.updateMany({
        where: {
          userId,
          purpose: TokenPurpose.session,
          revoked: false,
        },
        data: { revoked: true },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[RESET-PASSWORD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
