/**
 * Langkah database sebelum `next build`.
 *
 * Hanya berjalan saat driver Postgres aktif DAN ini build produksi Vercel
 * (VERCEL_ENV=production) atau DATA_STORE=postgres di mesin sendiri:
 *   1. prisma migrate deploy  (tabel selalu sesuai skema)
 *   2. prisma/seed.ts         (isi data contoh + admin bila database masih kosong)
 * Build preview dan mode dummy dilewati supaya tidak mengubah database produksi.
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { resolveStoreDriver } from "../src/lib/store/driver";

const driver = resolveStoreDriver();
if (driver !== "postgres") {
  console.log("[db] Mode database dummy: migrasi dilewati.");
  process.exit(0);
}
if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
  console.log(`[db] Build ${process.env.VERCEL_ENV ?? "non-produksi"}: migrasi otomatis dilewati.`);
  process.exit(0);
}

const run = (command: string) => execSync(command, { stdio: "inherit" });
console.log("[db] Menjalankan migrasi Postgres...");
run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");
