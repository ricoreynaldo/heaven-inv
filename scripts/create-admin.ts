/**
 * Buat admin baru atau reset password admin yang sudah ada, tanpa halaman
 * registrasi publik.
 *
 *   npm run admin:create -- --email admin@contoh.id --password "rahasia-panjang" [--name "Nama"]
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    name: { type: "string" },
  },
});

async function main() {
  const email = values.email?.trim().toLowerCase();
  const password = values.password;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Gunakan --email dengan alamat email yang valid.");
  if (!password || password.length < 10) throw new Error("Gunakan --password minimal 10 karakter.");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum diset.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 1 }) });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.upsert({
      where: { email },
      create: { email, passwordHash, name: values.name?.trim() || "Admin" },
      update: { passwordHash, ...(values.name ? { name: values.name.trim() } : {}) },
    });
    console.log(`Admin ${admin.email} siap. Sesi lama untuk akun ini otomatis tidak berlaku.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
