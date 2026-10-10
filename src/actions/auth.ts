"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminSession, destroyAdminSession, requireAdmin } from "@/lib/auth/admin";
import { PASSWORD_MIN_LENGTH, burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/auth/password";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { mutateDb, nowIso, readDb } from "@/lib/store";
import { toFieldErrors, type ActionResult } from "@/lib/validation/common";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email wajib diisi.").email("Format email tidak valid.").max(160),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") && !next.startsWith("/admin/login") ? next : "/admin";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = clientIp(await headers());
  const limited = await rateLimit(`login:${ip}`, LIMITS.login.limit, LIMITS.login.windowMs);
  if (!limited.ok) {
    const minutes = Math.ceil(limited.retryAfterSeconds / 60);
    return { error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${minutes} menit.` };
  }

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "").slice(0, 160);
  if (!parsed.success) {
    const errors = toFieldErrors(parsed.error);
    return { email, fieldErrors: { email: errors.email, password: errors.password } };
  }

  const admin = (await readDb()).admins.find((item) => item.email === parsed.data.email);
  if (!admin) {
    await burnPasswordCheck(parsed.data.password);
    return { email, error: "Email atau password salah." };
  }
  if (!(await verifyPassword(parsed.data.password, admin.passwordHash))) {
    return { email, error: "Email atau password salah." };
  }

  await createAdminSession(admin);
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password baru minimal ${PASSWORD_MIN_LENGTH} karakter.`)
      .max(200, "Password terlalu panjang."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "Password baru harus berbeda dari password saat ini.",
  });

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const current = await requireAdmin();
  const limited = await rateLimit(`password:${current.id}`, LIMITS.password.limit, LIMITS.password.windowMs);
  if (!limited.ok) return { ok: false, message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali isian password.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const admin = (await readDb()).admins.find((item) => item.id === current.id);
  if (!admin) return { ok: false, message: "Akun admin tidak ditemukan." };
  if (!(await verifyPassword(parsed.data.currentPassword, admin.passwordHash))) {
    return { ok: false, message: "Password saat ini salah.", fieldErrors: { currentPassword: "Password saat ini salah." } };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const updated = await mutateDb((db) => {
    const record = db.admins.find((item) => item.id === admin.id)!;
    record.passwordHash = passwordHash;
    record.updatedAt = nowIso();
    return { ...record };
  });
  // Token lama otomatis tidak berlaku (sidik jari password berubah); terbitkan yang baru.
  await createAdminSession(updated);
  return { ok: true, message: "Password berhasil diganti." };
}
