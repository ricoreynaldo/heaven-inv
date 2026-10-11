/**
 * Seed Postgres (Neon). Idempoten, aman dijalankan ulang; dipanggil otomatis
 * saat build produksi di Vercel (scripts/prepare-db.ts).
 *
 *   - Database masih kosong → diisi data contoh yang sama dengan database
 *     dummy (src/lib/store/seed.ts): kategori, undangan, konten, pengaturan.
 *   - Belum ada admin → dibuat dari SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 *     Password wajib diisi (min. 10 karakter) dan tidak boleh password contoh
 *     database dummy, karena kode ini publik.
 *   - SEED_RESET_ADMIN_PASSWORD=1 → ganti password admin tersebut dengan nilai di env.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { planWrites } from "../src/lib/store/plan";
import { applyPlan, createPrisma, loadDatabase, lockMutations } from "../src/lib/store/postgres";
import { createSeedDatabase, DUMMY_ADMIN_EMAIL, DUMMY_ADMIN_PASSWORD } from "../src/lib/store/seed";

const prisma = createPrisma(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, 1);

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || DUMMY_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  const passwordOk = password.length >= 10 && password !== DUMMY_ADMIN_PASSWORD;

  const summary = await prisma.$transaction(
    async (tx) => {
      await lockMutations(tx);
      const current = await loadDatabase(tx);
      const target = structuredClone(current);
      const notes: string[] = [];

      const empty =
        current.categories.length === 0 && current.templates.length === 0 && current.content.length === 0 && current.settings.length === 0;
      if (empty) {
        const seed = createSeedDatabase();
        Object.assign(target, { ...seed, admins: target.admins });
        notes.push(`data contoh: ${seed.categories.length} kategori, ${seed.templates.length} undangan`);
      }

      const existing = target.admins.find((admin) => admin.email === email);
      const now = new Date().toISOString();
      if (!existing && target.admins.length === 0) {
        if (!passwordOk) {
          throw new Error(
            "Belum ada admin. Isi SEED_ADMIN_PASSWORD (min. 10 karakter, bukan password contoh) lalu jalankan ulang.",
          );
        }
        target.admins.push({ id: randomUUID(), email, name: "Admin Heaven Inv", passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now });
        notes.push(`admin dibuat: ${email}`);
      } else if (existing && process.env.SEED_RESET_ADMIN_PASSWORD === "1") {
        if (!passwordOk) throw new Error("SEED_RESET_ADMIN_PASSWORD=1 butuh SEED_ADMIN_PASSWORD min. 10 karakter.");
        existing.passwordHash = await bcrypt.hash(password, 12);
        existing.updatedAt = now;
        notes.push(`password admin diganti: ${email}`);
      }

      await applyPlan(tx, planWrites(current, target));
      return notes;
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
  console.log(summary.length ? `[seed] ${summary.join("; ")}.` : "[seed] Database sudah berisi; tidak ada yang diubah.");
}

main()
  .catch((error) => {
    console.error(`[seed] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
