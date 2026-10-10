# Heaven Inv

Katalog undangan digital premium dengan pemesanan lewat WhatsApp dan CMS admin.
Pengunjung menjelajah katalog, membuka demo, lalu menekan **Pesan Sekarang** yang
membuka WhatsApp admin dengan pesan berisi template, kategori, harga, dan link demo.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 ·
PostgreSQL · Prisma 7 (driver adapter `pg`) · Zod · JWT (jose) + bcrypt · sharp · Vercel Blob (opsional)

## Mode data dummy (sementara)

Selama backend belum disambungkan, aplikasi **tidak memakai Postgres/Prisma**. Semua query publik
dan admin membaca/menulis satu file JSON lewat `src/lib/store` (default `.data/db.json`, di-ignore git).

- File dibuat otomatis dari seed (`src/lib/store/seed.ts`) saat pertama kali diakses.
- Perubahan dari panel admin tersimpan ke file itu dan bertahan setelah restart.
- Hapus `.data/db.json` untuk kembali ke data contoh. Lokasi bisa diganti dengan `DUMMY_DB_PATH`.
- Login admin: `SEED_ADMIN_EMAIL` (default `admin@heaveninv.id`) dan `SEED_ADMIN_PASSWORD`
  dari `.env` (min. 10 karakter; bila kosong dipakai `heaveninv123`). `AUTH_SECRET` tetap wajib.
- Saat kembali ke Postgres: ganti isi `src/lib/store` / `src/lib/data/*` dengan query Prisma.
  Skema Prisma sudah memakai kolom `tags` (pengganti `badge`) dan butuh migrasi baru.

Cukup `npm install`, isi `AUTH_SECRET` di `.env`, lalu `npm run dev`.

Desain: lihat `MASTER.md` (token warna, tipografi, motion GSAP). Tag katalog (Best Seller, New,
Promo, Premium) didefinisikan di `src/lib/tags.ts`.

## Menjalankan secara lokal (dengan Postgres, nanti)

Butuh Node.js 20.19+.

```bash
npm install
cp .env.example .env            # lalu isi AUTH_SECRET & SEED_ADMIN_PASSWORD
npm run db:local                # terminal terpisah: Postgres lokal (tanpa Docker) di port 5433
npm run db:setup                # migrasi + seed (admin, 5 kategori, 9 template, konten)
npm run dev                     # http://localhost:3060
```

Sudah punya Postgres sendiri (Neon, Supabase, lokal)? Lewati `db:local` dan isi `DATABASE_URL`.

Admin: `http://localhost:3060/admin/login` dengan `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dari `.env`.
Tidak ada registrasi publik; tambah atau reset admin lewat CLI:

```bash
npm run admin:create -- --email admin@contoh.id --password "minimal-10-karakter" --name "Nama"
```

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` / `build` / `start` | Development, build produksi, server produksi (port 3060) |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint, TypeScript, unit test (node:test) |
| `npm run db:local` | Postgres lokal via `embedded-postgres` (data di `.local-pg/`) |
| `npm run db:migrate` · `db:seed` · `db:setup` | Terapkan migrasi, isi data awal, atau keduanya |
| `npm run admin:create` | Buat admin / reset password |
| `npm run assets:generate` | Buat ulang gambar placeholder di `public/seed` & `public/brand` |

> `next build` memprerender halaman publik dari database, jadi database harus bisa diakses saat build.

## Struktur

```
src/
  app/(site)/            halaman publik: /, /catalog, /catalog/[slug]
  app/demo/[slug]        demo undangan bawaan (dibuka di tab baru)
  app/admin/login        login admin
  app/admin/(panel)/     dashboard, templates, categories, content, settings
  app/api/admin/upload   upload gambar (admin saja)
  app/media/[...key]     menyajikan file dari storage lokal
  actions/               server actions (selalu memanggil requireAdmin)
  components/{site,admin,ui}
  lib/
    auth/                sesi JWT, hash password, requireAdmin
    data/                query publik (use cache + tag) & query admin
    content/ settings/   skema + default konten CMS dan pengaturan
    storage/             abstraksi storage (local / vercel-blob), validasi gambar
    validation/          skema zod
    whatsapp.ts          pembentuk URL & pesan wa.me
  proxy.ts               gerbang awal /admin & /api/admin
prisma/                  schema, migrasi, seed
```

## Konten & cache

- Semua teks/gambar homepage ada di tabel `site_content`, pengaturan di `site_settings`.
  Nilai yang hilang/rusak otomatis jatuh ke default di `src/lib/content/schema.ts`.
- Halaman publik di-cache (`use cache` + `cacheTag`). Setiap simpan di admin memanggil
  `updateTag`, sehingga perubahan langsung tampil tanpa deploy ulang.

## WhatsApp

Nomor & template pesan diatur di **Admin → Settings → WhatsApp**. Placeholder:
`{{template_name}}`, `{{category}}`, `{{price}}`, `{{demo_url}}`. URL dibentuk di server:
`https://wa.me/<nomor>?text=<pesan ter-encode>`. Link demo relatif (mis. `/demo/elegant-rose`)
diubah menjadi absolut memakai `SITE_URL`.

> Seed memakai nomor contoh `6281234567890`; dashboard menampilkan peringatan sampai nomor diganti.

## Media / storage

- `STORAGE_DRIVER=local` → file di `STORAGE_LOCAL_DIR` (default `./storage/uploads`), disajikan `/media/*`.
  Cocok untuk VPS dengan disk permanen.
- `STORAGE_DRIVER=vercel-blob` (atau kosong + `BLOB_READ_WRITE_TOKEN` terisi) → Vercel Blob.
  **Wajib di Vercel/serverless**, karena filesystem di sana tidak permanen.
- Upload divalidasi dari magic bytes (JPG/PNG/WebP/AVIF, ICO khusus favicon; SVG ditolak),
  maks `MAX_UPLOAD_MB` (default 4), lalu di-encode ulang ke WebP (EXIF dibuang, maks 2400 px).
- File yang tidak lagi dirujuk dihapus otomatis saat template/kategori/konten diganti atau dihapus.

## Deploy ke Vercel

1. Buat database Postgres (mis. Neon) dan Blob store.
2. Set env: `DATABASE_URL`, `AUTH_SECRET`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN`
   (otomatis bila Blob store dihubungkan), opsional `UPSTASH_REDIS_REST_URL/TOKEN` untuk rate limit.
3. Build command: `prisma migrate deploy && npm run build`.
4. Sekali saja, isi data awal dari mesin lokal yang mengarah ke database produksi:
   `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed`.

## Keamanan

- Password bcrypt (cost 12); sesi JWT HS256 di cookie HttpOnly + SameSite=Lax, 8 jam.
  Token memuat sidik jari hash password, jadi ganti password mengakhiri sesi lama.
- `proxy.ts` menyaring `/admin/*` & `/api/admin/*`; setiap halaman, server action, dan route
  handler tetap memverifikasi sesi ke database (`requireAdmin` / `getCurrentAdmin`).
- Validasi server-side dengan zod di semua mutasi; rate limit login, upload, dan ganti password.
- Header keamanan (nosniff, frame, referrer, permissions) dan `noindex` untuk area admin.
