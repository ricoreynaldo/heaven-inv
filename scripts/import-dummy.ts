/**
 * Pindahkan isi database dummy (.data/db.json) ke Postgres (Neon).
 *
 *   npm run db:import                  (tampilkan ringkasan, tanpa menulis)
 *   npm run db:import -- --yes         (tulis ke database)
 *   npm run db:import -- --file path/db.json --yes
 *
 * Kategori, undangan + galeri, konten beranda, dan pengaturan di Postgres
 * diganti persis dengan isi file. Akun admin di Postgres TIDAK disentuh:
 * password database dummy tidak ikut dipindahkan (buat admin lewat
 * `npm run db:seed` atau `npm run admin:create`).
 *
 * Koneksi: DATABASE_URL_UNPOOLED bila ada (koneksi langsung Neon), selain itu DATABASE_URL.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { readJsonFile, jsonDbPath } from "../src/lib/store/json";
import { isEmptyPlan, planWrites } from "../src/lib/store/plan";
import { applyPlan, createPrisma, loadDatabase, lockMutations } from "../src/lib/store/postgres";

const { values } = parseArgs({
  options: {
    file: { type: "string" },
    yes: { type: "boolean", default: false },
  },
});

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const prisma = createPrisma(connectionString, 1);

function host(url = "") {
  try {
    return new URL(url).host;
  } catch {
    return "(tidak dikenal)";
  }
}

async function main() {
  const file = values.file ?? jsonDbPath();
  const source = await readJsonFile(file);
  if (!source) throw new Error(`File database dummy tidak ditemukan atau formatnya tidak dikenal: ${file}`);

  const localUploads = JSON.stringify(source).match(/"\/media\/[^"]+"/g) ?? [];
  if (localUploads.length) {
    console.warn(
      `[import] Peringatan: ${localUploads.length} gambar memakai upload lokal (/media/...). File itu tidak ada di Vercel; unggah ulang lewat admin setelah Vercel Blob aktif.`,
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      await lockMutations(tx);
      const current = await loadDatabase(tx);
      // Admin di Postgres dipertahankan; selebihnya mengikuti file.
      const target = { ...structuredClone(source), admins: current.admins };
      const plan = planWrites(current, target);
      const summary = {
        kategori: `${current.categories.length} → ${target.categories.length}`,
        undangan: `${current.templates.length} → ${target.templates.length}`,
        konten: `${current.content.length} → ${target.content.length} baris`,
        pengaturan: `${current.settings.length} → ${target.settings.length} baris`,
        admin: `${current.admins.length} (tidak diubah)`,
      };
      if (isEmptyPlan(plan)) return { summary, written: false, same: true };
      if (!values.yes) return { summary, written: false, same: false };
      await applyPlan(tx, plan);
      return { summary, written: true, same: false };
    },
    { maxWait: 10_000, timeout: 120_000 },
  );

  console.log(`[import] Sumber: ${file}`);
  console.log(`[import] Tujuan: ${host(connectionString)}`);
  console.table(result.summary);
  if (result.same) console.log("[import] Isi database sudah sama dengan file. Tidak ada yang ditulis.");
  else if (result.written) console.log("[import] Selesai. Data dummy sudah dipindahkan ke Postgres.");
  else console.log("[import] Belum ada yang ditulis. Jalankan ulang dengan --yes untuk memindahkan data.");
}

main()
  .catch((error) => {
    console.error(`[import] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
