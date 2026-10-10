const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** "Rp 149.000" — spasi biasa, bukan NBSP, supaya aman dipakai di pesan WhatsApp. */
export function formatRupiah(value: number): string {
  return rupiah.format(value).replace(/ /g, " ");
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDate(value: Date | string): string {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function pluralize(count: number, word: string): string {
  return `${count.toLocaleString("id-ID")} ${word}`;
}
