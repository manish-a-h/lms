import { NextRequest, NextResponse } from "next/server";
import { TokenPurpose } from "@/generated/prisma/client";
import { hashToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/data/users";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsedBody =
    typeof body === "object" && body && !Array.isArray(body)
      ? (body as { email?: unknown })
      : null;
  const email =
    typeof parsedBody?.email === "string" ? parsedBody.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);

    // Always return 200 to avoid user enumeration.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const allowDevResetPreview =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEV_PASSWORD_RESETS === "true" &&
      Boolean(appUrl);

    if (!allowDevResetPreview) {
      return NextResponse.json({ ok: true });
    }

    const resetToken = crypto.randomUUID();
    const tokenHash = await hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        purpose: TokenPurpose.reset,
        expiresAt,
      },
    });

    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}&uid=${encodeURIComponent(user.id)}`;

    return NextResponse.json({ ok: true, devResetUrl: resetUrl });
  } catch (error) {
    console.error("[FORGOT-PASSWORD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
