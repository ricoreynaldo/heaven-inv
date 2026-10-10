import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { passwordFingerprint } from "@/lib/auth/password";
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  signAdminToken,
  verifyAdminToken,
} from "@/lib/auth/session";
import { readDb } from "@/lib/store";

export type AdminUser = { id: string; email: string; name: string };

export async function createAdminSession(admin: { id: string; email: string; passwordHash: string }) {
  const token = await signAdminToken({ sub: admin.id, email: admin.email, pv: passwordFingerprint(admin.passwordHash) });
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, { ...sessionCookieOptions, maxAge: SESSION_TTL_SECONDS });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
}

/**
 * Admin yang sedang login, diverifikasi ke database (akun masih ada dan
 * password belum diganti sejak token dibuat). null bila tidak valid.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  // Verifikasi token bergantung waktu (exp), jadi selalu dijalankan per request.
  await connection();
  const jar = await cookies();
  const payload = await verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
  if (!payload) return null;
  const db = await readDb();
  const admin = db.admins.find((item) => item.id === payload.sub);
  if (!admin || passwordFingerprint(admin.passwordHash) !== payload.pv) return null;
  return { id: admin.id, email: admin.email, name: admin.name };
}

/**
 * Wajib dipanggil di setiap halaman admin, server action, dan route handler
 * admin. proxy.ts hanya pemeriksaan awal; ini lapisan otorisasi sebenarnya.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?expired=1");
  return admin;
}
