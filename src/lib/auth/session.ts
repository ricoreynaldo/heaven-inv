import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Token sesi admin (JWT HS256 di cookie HttpOnly).
 * Tidak memakai "server-only" karena juga dipakai proxy.ts.
 */

export const ADMIN_COOKIE = "hi_admin";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
const ISSUER = "heaven-inv";

export type AdminTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  /** Sidik jari hash password: sesi lama otomatis gugur setelah password diganti. */
  pv: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET belum diset atau kurang dari 32 karakter. Cek file .env.");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: { sub: string; email: string; pv: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string | undefined | null): Promise<AdminTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER, algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.pv !== "string") return null;
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
