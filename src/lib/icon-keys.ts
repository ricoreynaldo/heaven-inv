/** Ikon yang boleh dipilih admin untuk item "Why Us" & "How It Works". */
export const ICON_OPTIONS = [
  { key: "sparkle", label: "Kilau" },
  { key: "crown", label: "Mahkota" },
  { key: "device-mobile", label: "Ponsel" },
  { key: "share-network", label: "Bagikan" },
  { key: "lightning", label: "Cepat" },
  { key: "wallet", label: "Dompet" },
  { key: "heart", label: "Hati" },
  { key: "flower-lotus", label: "Bunga" },
  { key: "palette", label: "Palet" },
  { key: "cursor-click", label: "Pilih" },
  { key: "eye", label: "Lihat" },
  { key: "chat-circle-dots", label: "Chat" },
  { key: "whatsapp-logo", label: "WhatsApp" },
  { key: "envelope-open", label: "Undangan" },
  { key: "check-circle", label: "Selesai" },
  { key: "gift", label: "Hadiah" },
  { key: "calendar-heart", label: "Kalender" },
  { key: "map-pin", label: "Lokasi" },
  { key: "music-notes", label: "Musik" },
  { key: "images", label: "Galeri" },
  { key: "clock", label: "Waktu" },
  { key: "shield-check", label: "Aman" },
  { key: "star", label: "Bintang" },
] as const;

export type IconKey = (typeof ICON_OPTIONS)[number]["key"];

export const ICON_KEYS = ICON_OPTIONS.map((option) => option.key) as [IconKey, ...IconKey[]];
