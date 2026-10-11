# Heaven Inv

Katalog undangan digital premium dengan pemesanan lewat WhatsApp dan CMS admin.
Pengunjung menjelajah katalog, membuka demo, lalu menekan **Pesan Sekarang** yang
membuka WhatsApp admin dengan pesan berisi template, kategori, harga, dan link demo.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 ·
PostgreSQL · Prisma 7 (driver adapter `pg`) · Zod · JWT (jose) + bcrypt · sharp · Vercel Blob (opsional)

## Sumber data: dummy atau Postgres (Neon)

Semua query publik/admin dan server action memakai `readDb` / `mutateDb` dari `src/lib/store`.
Driver dipilih lewat env (`src/lib/store/driver.ts`):

| Kondisi | Driver |
| --- | --- |
| `DATA_STORE=postgres` | Postgres lewat `DATABASE_URL` |
| `DATA_STORE=dummy` | Database dummy JSON |
| `DATA_STORE` kosong, di Vercel dan `DATABASE_URL` ada | Postgres (otomatis) |
| `DATA_STORE` kosong, di laptop | Database dummy JSON (walau `.env` berisi `DATABASE_URL`) |

**Database dummy** (`.data/db.json`, di-ignore git): dibuat otomatis dari seed
(`src/lib/store/seed.ts`), perubahan admin tersimpan ke file itu. Hapus file untuk kembali ke data
contoh; lokasi bisa diganti dengan `DUMMY_DB_PATH`. Login: `SEED_ADMIN_EMAIL` (default
`admin@heaveninv.id`) dan `SEED_ADMIN_PASSWORD` (min. 10 karakter; bila kosong dipakai password
contoh `heaveninv123`, **hanya untuk lokal**). Cocok untuk laptop, tidak untuk Vercel (data hanya
di memori dan hilang saat server berganti).

**Postgres / Neon** (`src/lib/store/postgres.ts`): bentuk data sama dengan dummy. Setiap mutasi
berjalan di satu transaksi dengan advisory lock dan hanya menulis baris yang berubah, jadi aman
untuk beberapa instance serverless.

Cukup `npm install`, isi `AUTH_SECRET` di `.env`, lalu `npm run dev` (mode dummy).

Desain: lihat `MASTER.md` (token warna, tipografi, motion GSAP). Tag katalog (Best Seller, New,
Promo, Premium) didefinisikan di `src/lib/tags.ts`.

## Menjalankan dengan Postgres lokal

Butuh Node.js 20.19+.

```bash
npm install
cp .env.example .env            # isi AUTH_SECRET & SEED_ADMIN_PASSWORD
npm run db:local                # terminal terpisah: Postgres lokal (tanpa Docker) di port 5433
npm run db:setup                # migrasi + seed (admin, 5 kategori, 9 undangan, konten)
npm run db:import -- --yes      # opsional: pindahkan isi .data/db.json ke Postgres
DATA_STORE=postgres npm run dev # http://localhost:3060
```

Admin: `http://localhost:3060/admin/login`. Tidak ada registrasi publik; tambah atau reset admin
lewat CLI:

```bash
npm run admin:create -- --email admin@contoh.id --password "minimal-10-karakter" --name "Nama"
```

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` / `build` / `start` | Development, build produksi, server produksi (port 3060) |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint, TypeScript, unit test (node:test) |
| `npm run db:local` | Postgres lokal via `embedded-postgres` (data di `.local-pg/`) |
| `npm run db:migrate` · `db:seed` · `db:setup` | Terapkan migrasi, isi data awal (hanya bila kosong), atau keduanya |
| `npm run db:import` | Pindahkan isi `.data/db.json` ke Postgres (tanpa `-- --yes` hanya menampilkan ringkasan; admin tidak disentuh) |
| `npm run admin:create` | Buat admin / reset password |
| `npm run assets:generate` | Buat ulang gambar placeholder di `public/seed` & `public/brand` |

> `next build` memprerender halaman publik dari database, jadi database harus bisa diakses saat build.
> Saat build produksi Vercel dengan Postgres, `scripts/prepare-db.ts` otomatis menjalankan
> `prisma migrate deploy` lalu seed (hanya bila database kosong). Build preview dan mode dummy dilewati.

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
  `revalidateTag(tag, "max")` (stale-while-revalidate): kunjungan pertama setelah simpan bisa masih
  versi lama, kunjungan berikutnya sudah baru, tanpa deploy ulang. `updateTag` sengaja tidak
  dipakai: di Next.js 16.4 navigasi klik pertama ke halaman detail gagal setelah cache dihapus seketika.

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

## Deploy ke Vercel + Neon

1. **Project:** vercel.com → Add New → Project → import repo GitHub ini.
2. **Database:** di project Vercel, tab Storage → Create Database → **Neon**, region Singapore
   (AWS ap-southeast-1), hubungkan ke Production/Preview/Development. Vercel mengisi
   `DATABASE_URL` (pooled, dipakai aplikasi) dan `DATABASE_URL_UNPOOLED` (langsung, dipakai migrasi).
3. **Region fungsi:** Settings → Functions → Function Region → Singapore (`sin1`), dekat database.
4. **Blob:** Storage → Create → **Blob**, hubungkan → `BLOB_READ_WRITE_TOKEN` terisi (wajib untuk upload).
5. **Env lain:** `AUTH_SECRET` (min. 32 karakter acak), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
   (min. 10 karakter, bukan password contoh), opsional `SITE_URL` dan `UPSTASH_REDIS_REST_URL/TOKEN`.
6. **Deploy.** Build produksi menjalankan migrasi + seed otomatis; database kosong terisi data contoh
   dan admin dibuat dari `SEED_ADMIN_*`.
7. **Opsional, pindahkan isian lokal:** salin `DATABASE_URL` & `DATABASE_URL_UNPOOLED` Neon ke `.env`
   laptop, lalu `npm run db:import` (cek ringkasan) dan `npm run db:import -- --yes`.

## Keamanan

- Password bcrypt (cost 12); sesi JWT HS256 di cookie HttpOnly + SameSite=Lax, 8 jam.
  Token memuat sidik jari hash password, jadi ganti password mengakhiri sesi lama.
- `proxy.ts` menyaring `/admin/*` & `/api/admin/*`; setiap halaman, server action, dan route
  handler tetap memverifikasi sesi ke database (`requireAdmin` / `getCurrentAdmin`).
- Validasi server-side dengan zod di semua mutasi; rate limit login, upload, dan ganti password.
- Header keamanan (nosniff, frame, referrer, permissions) dan `noindex` untuk area admin.
