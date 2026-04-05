import { SignJWT, jwtVerify } from "jose";
import bcryptjs from "bcryptjs";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-access-secret-change-in-production"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-production"
);

export type JWTPayload = {
  sub: string;       // user id
  email: string;
  role: string;
  name: string;
};

// ─── Password Helpers ────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcryptjs.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(plain, hash);
}

// ─── Access Token (15 min) ───────────────────────────────────────────────────

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  const expires = process.env.JWT_ACCESS_EXPIRES ?? "15m";
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(ACCESS_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as unknown as JWTPayload;
}

// ─── Refresh Token (7 days) ──────────────────────────────────────────────────

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(REFRESH_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as unknown as JWTPayload;
}

// ─── Token hash for DB storage ───────────────────────────────────────────────

export async function hashToken(token: string): Promise<string> {
  return bcryptjs.hash(token, 10);
}

export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(token, hash);
}
