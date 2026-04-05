import { NextRequest } from "next/server";
import { verifyAccessToken, type JWTPayload } from "./auth";

export type SessionUser = JWTPayload;

// ─── Read session from request cookies ──────────────────────────────────────

export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

// ─── Throw 401 if not authenticated ─────────────────────────────────────────

export async function requireSession(request: NextRequest): Promise<SessionUser> {
  const user = await getSession(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

// ─── Throw 403 if wrong role ─────────────────────────────────────────────────

export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<SessionUser> {
  const user = await requireSession(request);
  if (!roles.includes(user.role)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  };
}

export function refreshTokenCookieOptions() {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * days,
  };
}
