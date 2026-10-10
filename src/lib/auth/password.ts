import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Hash dummy (dibuat sekali) untuk menyamakan waktu respons saat email tidak terdaftar. */
let dummyHash: Promise<string> | null = null;

export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= bcrypt.hash("heaven-inv-timing-guard", BCRYPT_COST);
  await bcrypt.compare(plain, await dummyHash);
}

/** Sidik jari pendek dari hash password, disimpan di token sesi. */
export function passwordFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

export const PASSWORD_MIN_LENGTH = 10;
