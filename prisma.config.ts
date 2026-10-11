import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrasi butuh koneksi langsung. Neon (lewat Vercel) menyediakan
  // DATABASE_URL_UNPOOLED untuk itu; aplikasi sendiri memakai DATABASE_URL (pooled).
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
  },
});
