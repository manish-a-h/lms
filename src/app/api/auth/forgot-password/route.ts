import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/data/users";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // Always return 200 to avoid user enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate a short-lived reset token (stored as a refresh token with 1h expiry)
    const resetToken = crypto.randomUUID();
    const tokenHash = await hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // TODO: Send email with reset link
    // The reset link would be: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&uid=${user.id}`
    console.log(`[FORGOT-PASSWORD] Reset token for ${email}: ${resetToken}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[FORGOT-PASSWORD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
