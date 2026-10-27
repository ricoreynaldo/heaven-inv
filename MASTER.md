# Heaven Inv — Design System (MASTER)

Sumber kebenaran tunggal untuk seluruh UI situs publik dan panel admin.
Token kode ada di `src/app/globals.css` (`@theme`) dan `src/lib/motion.ts` (GSAP).
Jangan menulis hex, durasi, atau easing di komponen: pakai token di bawah.

## Thesis (tervalidasi 2026-10-08)

**Visual.** Katalog terang ala galeri: kanvas `#FAF9F6`, kartu `#FFFFFF`, teks dan tombol utama
`#252321`, `#C9B79C` hanya sebagai aksen (tag, garis tipis, hover). Tanpa serif: display Plus Jakarta Sans
600 rapat (diganti pemilik 2026-10-09, sebelumnya Instrument Serif) + Geist untuk UI dan harga
(angka tabular). Aksen di judul = kata kedua berbobot regular warna ink-soft, bukan italic. Spasi lapang, basis 4px. Komponen flat dengan border hairline 1px, radius kartu
6px, tombol dan tag bersudut kecil, tanpa gradient dan tanpa shadow berat.

**Interaction.** GSAP medium-cepat (200–600ms, `power3.out` / `expo.out`): headline hero muncul
per baris saat load, kartu katalog stagger-in 60ms via `ScrollTrigger.batch` (sekali), hover kartu
= zoom gambar 1.04 + panah demo bergeser (CSS 250ms), ganti filter = transisi grid via GSAP Flip.
Dilarang: bounce/elastic/overshoot, parallax, pinning/scroll-jacking, animasi looping.
`prefers-reduced-motion: reduce` → tanpa gerak (konten langsung tampil).

**Thesis visual v3 (divalidasi pemilik 2026-10-10, mengikuti referensi product listing minimalis).**
Halaman putih #FFFFFF dengan ruang kosong lebar; #FAF9F6 hanya sebagai latar gambar. Sudut tajam
(radius 0) di situs dan admin; yang bulat hanya tombol menu, toggle switch, dan avatar. Kartu katalog
tanpa bingkai/bayangan: gambar 4:5, lalu nama (Plus Jakarta Sans 600, 14px) + kategori abu-abu, harga
13px di bawahnya. Tag berupa label kotak kecil uppercase di pojok kanan atas gambar (Best Seller
terisi tinta, lainnya putih bergaris). Grid 4 kolom dengan jarak baris besar. Header hanya tombol menu
bulat (kiri), logo (tengah), ikon cari (kanan). Katalog: breadcrumb + urutan sebagai teks di satu baris,
judul kecil tebal + chip filter "× Wedding" yang bisa dihapus, tombol "Filter By" bergaris tajam,
pagination teks "Sebelumnya 3 / 8 Berikutnya". Animasi baru: menu membesar melingkar dari tombolnya
(clip-path), panel pencarian instan turun dari atas, panel filter meluncur dari kanan, angka pagination
bergulir, teks "Lihat demo" meluncur di bawah gambar saat kartu disorot. Diterapkan ke seluruh situs, halaman demo
bawaan, dan admin (latar admin juga putih; panel dipisah hairline). Judul hero maks 60px, teks
pendukung 14–16px. Pengecualian yang disengaja: gelembung pratinjau WhatsApp di Pengaturan tetap
bulat karena meniru tampilan chat WhatsApp.

**Thesis visual v5: lookbook tenang (diminta pemilik 2026-10-10, referensi halaman koleksi fashion
minimal; menggantikan v4).** Setiap section seperti satu halaman lookbook: hampir kosong, semua di
tengah. Judul = Geist 600 KAPITAL dengan spasi huruf lebar 0.12em, ukuran sedang (`title-caps`: hero
26–46px, section 20–26px), bukan raksasa. Di bawah judul satu baris keterangan abu-abu kecil kapital
berspasi 0.16em (`meta-caps`, 11px). Tombol di beranda diganti link teks kecil kapital bergaris tipis
(`TextLink`). Tanpa pil: kontrol kembali bersudut tajam, tag = label kotak kecil. Header = deretan teks
kecil kapital tersebar rata (brand kiri, Katalog, Best Seller, Cari, lalu WhatsApp + ikon menu dua
garis di kanan); HP: brand, ikon cari, ikon menu. Hero: judul dua baris di tengah, keterangan abu-abu,
dua link teks; pojok kiri bawah kalimat pembuka kecil, pojok kanan bawah sorotan undangan kecil yang
bergiliran. Kategori: nama kapital berspasi ditumpuk di tengah dengan angka kecil di sampingnya.
Keunggulan dan Cara pesan: kolom teks di tengah. FAQ: daftar sempit di tengah dengan plus tipis.
CTA: judul + keterangan + dua link teks, tanpa latar. Footer putih, semua teks kecil kapital.
Paragraf panjang (tentang, jawaban FAQ, deskripsi) tetap kalimat biasa. Animasi v5: huruf judul menyala
dalam urutan acak (SplitText chars), judul hero merapat spasi hurufnya dari 0.42em (layar lebar) dan
melebar ke 0.18em saat disorot, sorotan pojok berganti pudar tiap 2.4 detik (berhenti saat tak terlihat
atau disorot), gambar kategori mengikuti kursor dan nama lain meredup. Admin ikut v5 (2026-10-10):
judul halaman, judul panel, menu sidebar, tab, kepala tabel, badge status, dan label kecil memakai
`title-caps` / `meta-caps`; tab = teks kapital dengan garis bawah tinta yang meluncur; menu aktif =
latar canvas + garis tinta 2px di kiri; brand + logo di sidebar. Isi form, label field, tabel, tombol,
dan teks bantuan tetap huruf biasa supaya mudah dibaca.

**Thesis visual v4: poster tipografis (2026-10-10, digantikan v5 di hari yang sama; dicatat sebagai
riwayat).** Berlaku untuk hero dan semua section situs publik; menimpa v3 untuk hal yang
disebut di sini. Judul = poster: Plus Jakarta Sans 500 KAPITAL, tracking -0.05em, leading 0.92
(`display-caps`), ukuran besar fluid (hero 44–100px, section 36–76px, kategori 36–92px), sering di
tengah. Hero: label pil kecil, judul dua baris dipisah di koma pertama dengan panah di depan dan
gambar undangan setinggi huruf kapital disisipkan sebelum kata terakhir, satu tombol pil hitam + satu
pil bergaris, lalu baris info empat kolom kecil kapital di kaki layar (kalimat pembuka, kategori sebagai
pil, jumlah koleksi + harga mulai, nomor WhatsApp). Teks pendukung pendek = `meta-caps` (12px kapital,
tanpa tracking lebar); paragraf panjang (tentang, jawaban FAQ, deskripsi) tetap kalimat biasa supaya
terbaca. Kontrol situs publik berbentuk pil (`site-pills` membuat `rounded-control` = 9999px): tombol,
label, tag, link kecil, tombol bulat. Media tetap tajam (gambar, kartu, strip demo). Admin tetap bersudut.
Kategori menjadi indeks tipografis (nama kapital besar per baris, hairline). CTA penutup = poster di
latar canvas dengan gelembung chat bergaris di tengah kalimat; footer ikut latar canvas dengan kolom
info kecil kapital dan pil sosial (IG, WA). Animasi v4: baris judul naik dari balik garis (SplitText
mask), gambar hero membuka dari lebar 0 lalu bergiliran tiap 2.4 detik dan melebar saat judul disorot,
gambar kategori mengikuti kursor dengan tirai dari bawah, garis tinta tergambar mengikuti scroll, titik
gelembung chat "mengetik". Dua animasi berulang (gambar hero bergiliran, titik mengetik) sengaja
diizinkan: keduanya kecil, hanya berjalan saat terlihat di layar, dan mati dengan reduced motion.
Tumpukan kartu hero dan parallax kategori v2 dihapus.

**Amandemen interaksi (divalidasi pemilik 2026-10-09).** Situs dibuat lebih interaktif, tetap halus
(power3/expo.out, tanpa overshoot): tumpukan hero mengikuti mouse (kedalaman per lapisan, maks 18px)
dan bergeser pelan saat scroll; gambar kategori parallax halus (±6%); tombol utama magnetik (tarikan
maks 30% jarak, kembali 400ms); progress bar scroll 2px di atas layar; navbar menyingkir saat scroll
turun dan kembali saat scroll naik; indikator tab meluncur (katalog & admin); menu HP masuk berurutan
dan punya animasi keluar; angka dashboard admin menghitung naik. Larangan parallax dicabut khusus untuk
hero dan gambar kategori. Tetap dilarang: pinning/scroll-jacking, animasi looping, bounce/overshoot,
kursor custom. Efek kursor hanya untuk pointer presisi; semua efek mati dengan reduced motion.

**Allowed patterns:** Plus Jakarta Sans 600 sebagai display (dipilih pemilik), ground off-white hangat
`#FAF9F6` (palet pemilik), label kecil uppercase ber-tracking, garis hairline, label tag kotak di pojok gambar, judul kapital berspasi lebar di tengah (v5), link teks kecil kapital sebagai tombol beranda (v5), daftar kategori dengan gambar mengikuti kursor, sorotan pojok hero yang bergiliran dan berhenti saat tidak terlihat (v5), tombol magnetik (halaman detail), progress bar scroll (melaporkan posisi baca sungguhan).

## Warna

| Token | Hex | Peran | Kontras |
|---|---|---|---|
| `surface` | `#FFFFFF` | kartu, panel, input | — |
| `canvas` | `#FAF9F6` | latar halaman, hover di atas surface | — |
| `ink` | `#252321` | teks utama, tombol primer | 14.9:1 di canvas, 15.7:1 di surface |
| `ink-soft` | `#5E5A55` | teks sekunder | 6.5:1 di canvas |
| `ink-muted` | `#77716A` | caption, label, placeholder | 4.6:1 di canvas |
| `accent` | `#C9B79C` | tag, hairline aksen, hover ring, garis aktif | 2.0:1 — dekor saja, tidak untuk teks |
| `accent-soft` | `#EFE8DC` | latar tag & highlight | ink di atasnya 12.9:1 |
| `accent-deep` | `#7C6A4F` | teks beraksen (label kategori) | 5.0:1 di canvas |
| `line` | `#E9E5DE` | hairline default | — |
| `line-strong` | `#D6D0C6` | border input, hairline tegas | — |
| `success` / `-soft` | `#3F6B45` / `#E6EDE4` | status published | 6.2:1 |
| `danger` / `-soft` | `#9E3B30` / `#F6E4E0` | error, hapus | 6.7:1 |
| `warning` / `-soft` | `#8A5F1C` / `#F5EBD8` | peringatan | — |

## Tipografi

| Peran | Font | Ukuran | Catatan |
|---|---|---|---|
| Judul (hero, section, halaman) v5 | Geist 600 KAPITAL (`title-caps`) | hero 26–46px, section 20–26px, halaman 20–32px | tracking 0.12em, leading 1.3 |
| Keterangan, link teks, kolom info v5 | Geist 500 KAPITAL (`meta-caps`) | 11px | tracking 0.16em, leading 1.8 |
| Nama undangan (kartu) | Plus Jakarta Sans 600 | 16–18px | tracking -0.02em |
| Logo wordmark | Plus Jakarta Sans 600 + kata terakhir 400 | 19–26px | tracking -0.04em |
| Aksen judul | Plus Jakarta Sans 400, `ink-soft` | ikut judul | pengganti italic |
| UI / body | Geist variable 400/500/600 | 14–18px | leading 1.6 |
| Harga | Geist 500 | 15–24px | `tabular` (angka tabular) |
| Label | Geist 500 | 11–12px | UPPERCASE, tracking 0.16em |

`.font-display` di `globals.css` memberi default weight 600 dan tracking -0.035em; utility
`font-normal` / `tracking-*` tetap bisa menimpanya.
Fallback: `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif` dan `"Geist", ui-sans-serif, system-ui, sans-serif`.
File font lokal di `src/app/fonts` (dari @fontsource-variable), tanpa request pihak ketiga.

## Spasi

Basis 4px (skala Tailwind). Gutter halaman 20px (mobile) / 32px (≥768px), lebar maks 80rem.
Jarak section 96px (mobile) / 128px (desktop). Jarak antar kartu 20–28px.

## Radius

v5: semua kembali 0 (pil v4 dihapus). Bulat hanya tombol WhatsApp melayang, toggle switch, avatar.
Riwayat di bawah.

Kecil dan tegas (diubah pemilik 2026-10-09, sebelumnya kartu 16px + tombol pill):
`rounded-card` 6px (kartu, panel, dialog) · `rounded-inner` 4px (gambar di dalam kartu, input,
thumbnail) · `rounded-control` 6px (tombol, chip filter, tag, pencarian, pagination).
Tetap bulat hanya: toggle switch, avatar inisial, spinner.

## Shadow

Tidak ada untuk kartu/panel (hairline `ring-1 ring-line`). Satu shadow halus `shadow-pop`
hanya untuk dialog, toast, tombol WhatsApp melayang, dan kartu tumpukan di hero (memisahkan lapisan).

### Hero: galeri Caspia (2026-10-27)

Menggantikan hero lookbook v5 atas permintaan pemilik. Latar tetap `surface` putih.
Headline CMS kapital besar dan rapat di tengah, tagline, kalimat pembuka, serta dua link CTA.
Maksimal tujuh thumbnail 4:5 dipilih acak tanpa duplikasi dari seluruh katalog published dengan
kategori aktif setiap kunjungan; pemilihan di browser agar cache server dan hydration tetap aman.
Gambar mengorbit perlahan (72 detik/putaran), dengan jalur yang menyisakan ruang tengah untuk copy.
Pada layar <1024px, empat gambar berada di tepi atas/bawah dengan drift 10px. Efek berulang ini
diizinkan khusus hero sesuai referensi baru. Ada kontrol Jeda/Putar; gerak berhenti saat hero di
luar viewport atau tab tersembunyi. Reduced motion menampilkan komposisi statis tanpa kontrol.
Tidak ada perubahan pada nav, palet, copy CMS, atau pola section lainnya.

### Hero: lookbook (v5, digantikan hero galeri)

Judul dari Konten > Bagian atas (`headline`, saat ini nama brand "Heaven Inv"; dipisah di koma
pertama bila ada), tidak patah di layar ≥768px. `eyebrow` = keterangan abu-abu di bawah judul (saat ini
tagline "Your Story, Beautifully Invited"). Semua tampil kapital sesuai gaya v5; teks tersimpan apa adanya. `primaryCta` / `secondaryCta` = dua link
teks (katalog, WhatsApp konsultasi). `subtitle` = pojok kiri bawah. Pojok kanan bawah = sorotan:
thumbnail 4:5 kecil + nama, isinya Best Seller lalu Koleksi Pilihan (maks 5), cadangan `hero.image`;
disembunyikan di layar <640px karena tertutup tombol WhatsApp melayang.

### Brand di header & footer (v5)

`BrandMark variant="caps"`: nama brand Geist 600 kapital tracking 0.2em, 14–15px (sedikit lebih
besar dari link header 11px). Logo dari Pengaturan > Identitas brand bersifat opsional: ikon persegi
1.75em (±26px) di kiri nama, `object-contain`; di atas menu gelap logo dibuat putih (brightness-0 invert).

## Motion

| Token | Nilai | Pakai untuk |
|---|---|---|
| `fast` | 200ms | hover warna, state tombol |
| `base` | 400ms | reveal kartu, transisi filter |
| `slow` | 600ms | headline hero per baris |
| `ease-out` | `power3.out` / `cubic-bezier(0.215, 0.61, 0.355, 1)` | default |
| `ease-expo` | `expo.out` / `cubic-bezier(0.16, 1, 0.3, 1)` | reveal besar, zoom gambar |
| `stagger` | 60ms | kartu katalog |

### Peta animasi GSAP

| Di mana | Komponen | Perilaku |
|---|---|---|
| Hero homepage | `motion/hero-motion.tsx` | huruf judul menyala acak (SplitText chars, ±1s); layar lebar: spasi huruf judul merapat 0.42em → 0.12em (1.8s expo.out) dan keterangan 0.5em → 0.16em; link & pojok fade + naik 10px berurutan |
| Hero: sorotan pojok | `motion/hero-motion.tsx` | thumbnail + nama berganti pudar (800ms) tiap 2.4 detik; berhenti saat hero di luar layar atau pojok disorot |
| Hero: hover judul | `motion/hero-motion.tsx` | spasi huruf judul melebar ke 0.18em (900ms expo.out), kembali saat kursor keluar; pointer presisi ≥768px |
| Judul section | `motion/split-title.tsx` | huruf menyala dalam urutan acak saat masuk layar (SplitText words+chars, 500ms per huruf, total 0.6s) |
| Daftar kategori | `site/category-index.tsx` | gambar kategori mengikuti kursor di belakang teks (quickTo 600ms, miring ±8°), pudar silang saat pindah baris; nama lain meredup (CSS) |
| Section homepage, info detail | `motion/reveal.tsx` | fade + naik 16px saat masuk layar (ScrollTrigger.batch); `onMount` untuk konten di atas fold |
| Grid /catalog | `motion/flip-grid.tsx` | ganti filter = kartu pindah posisi (Flip 400ms), kartu baru fade dari 0.97 |
| Hover kartu (mouse saja) | `motion/card-motion.tsx` | thumbnail zoom 1.04 + halaman isi pertama memudar di atasnya (400ms expo.out), keluar 200ms |
| Klik kartu → detail | `motion/card-transition.ts` | salinan thumbnail terbang ke gambar utama galeri (FLIP manual, 600ms expo.out) |
| Galeri detail | `site/template-gallery.tsx` | slide lama keluar, baru masuk 6% dari arah tujuan (400ms power3.out); swipe/drag via Observer, tombol, thumbnail, panah keyboard |

| Tombol magnetik | `motion/magnetic.tsx` | `[data-magnetic]` mengikuti 30% jarak kursor (quickTo 400ms), kembali saat kursor keluar |
| Progress bar | `motion/scroll-progress.tsx` | garis 2px di atas layar, scaleX = posisi baca |
| Navbar | `site/navbar.tsx` | menyingkir saat scroll turun (250ms), kembali saat naik / 120px teratas / fokus keyboard (300ms) |
| Menu HP | `site/navbar.tsx` | panel memudar 200ms + item naik berurutan 50ms; keluar memudar 200ms tanpa stagger |
| Indikator tab | `motion/tab-indicator.ts` | garis bawah tinta 1px meluncur ke tab aktif 400ms (tab admin: Katalog, Konten, Pengaturan) |
| Angka dashboard | `motion/count-up.tsx` | menghitung naik 0 → nilai, 800ms |
| Akordeon FAQ | `site/faq-list.tsx` | <details> native (satu terbuka sekaligus); jawaban turun 6px + memudar masuk 400ms; ikon plus → minus (CSS 200ms); tinggi tidak dianimasikan |
| Menu layar penuh | `site/menu-overlay.tsx` | membesar melingkar dari tombol menu (clip-path circle, 700ms expo.out), link naik berurutan 60ms; tutup menyusut 400ms power3.in |
| Pencarian instan | `site/search-overlay.tsx` | panel turun dari atas 500ms expo.out + latar memudar; hasil muncul berurutan 40ms saat mengetik; tombol `/` membuka |
| Panel Filter By | `site/filter-drawer.tsx` | meluncur dari kanan 500ms expo.out, isi masuk berurutan; pilihan langsung diterapkan (grid Flip di belakang) |
| Pagination | `site/catalog-pagination.tsx` | angka halaman bergulir masuk dari arah perpindahan 400ms; grid memudar berurutan |
| Strip demo kartu | `motion/card-motion.tsx` | "Lihat demo" naik dari bawah tepi gambar saat hover/fokus 400ms; reduced motion = muncul tanpa gerak |

Elemen yang digerakkan GSAP lewat transform tidak boleh punya transisi CSS pada transform/opacity
(lihat aturan `[data-magnetic]` di `globals.css`); bungkus elemennya bila perlu.
Hover tombol, link, ring kartu, dialog, dan toggle admin tetap CSS (instan, tanpa JS).

## Komponen dasar

- **Button** sudut 6px. `primary` ink/putih, `secondary` surface + ring line-strong (hover ring accent),
  `ghost`, `danger`. Lima state: default, hover, focus-visible (outline ink 2px), active (scale 0.98),
  disabled (opacity 50%).
- **Tag** kecil sudut 6px: `accent-soft` + teks ink, label uppercase 11px. Best Seller = ink + teks putih
  (satu-satunya tag gelap, supaya terbaca sebagai sinyal utama).
- **Card template**: surface, ring line, radius 6px, padding 8px, gambar 4:5 radius 4px; meta
  (kategori accent-deep), nama (Plus Jakarta Sans 600 18px), harga tabular, dua aksi: Detail + Demo ↗.
- **Input**: surface, border line-strong, radius 4px, tinggi 44–48px, focus border ink + ring accent.

## Pola panel admin

Tujuan: admin non-teknis tidak pernah bingung di mana menyimpan, dan tidak pernah kehilangan isian.

- **Bahasa:** Indonesia sehari-hari. Hindari istilah teknis di label (bukan "Published", "Featured",
  "SEO title", "OG image", "Hero", "CTA"). Istilah teknis yang perlu tetap ada (slug, favicon) ditulis
  dalam kurung setelah nama biasanya dan disimpan di "Pengaturan lanjutan".
- **Simpan:** satu tempat saja, `SaveBar` (`components/admin/save-bar.tsx`) yang menempel di bawah layar,
  dengan status "Ada perubahan yang belum disimpan" / "Semua perubahan tersimpan" dan tombol Batalkan.
- **Penjaga perubahan:** `useUnsavedGuard` memberi konfirmasi saat menutup tab, reload, klik menu, atau
  pindah tab Konten/Pengaturan selagi ada isian yang belum disimpan.
- **Tab satu-per-satu** untuk Konten beranda (urut sesuai posisi di beranda) dan Pengaturan; link
  `#hash` membuka tab yang dituju.
- **Tabel:** aksi utama berlabel teks (Edit), aksi lain di menu ⋯ (lihat di situs, buka demo, hapus).
  Status yang bisa diubah sekali klik selalu berlabel: Tampil/Draft, Best Seller, Beranda.
- **Filter tanpa tombol Terapkan:** tab dengan jumlah, pencarian berjalan saat mengetik.
- **Field penting di atas:** form undangan urut 1. Info utama (nama, kategori, harga, link demo, tag),
  2. Gambar, 3. Halaman detail, lalu Pengaturan lanjutan.
