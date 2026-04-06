import { SignJWT, jwtVerify } from "jose";
import bcryptjs from "bcryptjs";

function getRequiredSecret(name: "JWT_SECRET" | "JWT_REFRESH_SECRET") {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`Missing ${name}`);
  }

  return new TextEncoder().encode(value);
}

let accessSecret: Uint8Array | null = null;
let refreshSecret: Uint8Array | null = null;

function getAccessSecret() {
  accessSecret ??= getRequiredSecret("JWT_SECRET");
  return accessSecret;
}

function getRefreshSecret() {
  refreshSecret ??= getRequiredSecret("JWT_REFRESH_SECRET");
  return refreshSecret;
}

export type JWTPayload = {
  sub: string;
  jti: string;
  email: string;
  role: string;
  name: string;
};

export function createSessionTokenId() {
  return crypto.randomUUID();
}

// ─── Password Helpers ────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcryptjs.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(plain, hash);
}

async function signToken(
  payload: JWTPayload,
  secret: Uint8Array,
  expiresIn: string
): Promise<string> {
  const { sub, jti, email, role, name } = payload;

  return new SignJWT({ email, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// ─── Access Token (15 min) ───────────────────────────────────────────────────

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  const expires = process.env.JWT_ACCESS_EXPIRES ?? "15m";
  return signToken(payload, getAccessSecret(), expires);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as unknown as JWTPayload;
}

// ─── Refresh Token (7 days) ──────────────────────────────────────────────────

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7);
  return signToken(payload, getRefreshSecret(), `${days}d`);
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as unknown as JWTPayload;
}

// ─── Token hash for DB storage ───────────────────────────────────────────────

export async function hashToken(token: string): Promise<string> {
  return bcryptjs.hash(token, 10);
}

export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(token, hash);
}
