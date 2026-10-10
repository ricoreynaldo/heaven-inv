/**
 * Utilitas WhatsApp order flow. Murni (tanpa I/O) supaya mudah diuji:
 * nomor & template pesan selalu datang dari SiteSettings, bukan dari komponen.
 */

export const ORDER_PLACEHOLDERS = ["template_name", "category", "price", "demo_url"] as const;
export type OrderPlaceholder = (typeof ORDER_PLACEHOLDERS)[number];

/**
 * Normalisasi nomor ke format internasional tanpa "+" seperti yang diminta wa.me.
 * "0812-3456-7890" → "6281234567890", "+62 812 3456 7890" → "6281234567890".
 * Mengembalikan null bila tidak terlihat seperti nomor telepon.
 */
export function normalizeWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 13) digits = `62${digits}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/** "6285920063749" → "0859 2006 3749" untuk ditampilkan. Nomor tak valid dikembalikan apa adanya. */
export function formatPhoneNumber(number: string): string {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return number;
  const local = normalized.startsWith("62") ? `0${normalized.slice(2)}` : normalized;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1 $2 $3");
}

/** Ganti {{placeholder}}. Placeholder yang tidak dikenal dibiarkan apa adanya. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = values[key.toLowerCase()];
    return value === undefined ? match : value;
  });
}

export function buildWhatsAppUrl(number: string | null | undefined, message?: string): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  const text = message?.trim();
  return text ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}` : `https://wa.me/${normalized}`;
}

export type OrderDetails = {
  templateName: string;
  category: string;
  /** Harga yang sudah diformat, mis. "Rp 149.000". */
  price: string;
  /** URL demo absolut, atau string kosong bila template tidak punya demo. */
  demoUrl: string;
};

export function buildOrderMessage(template: string, order: OrderDetails): string {
  const filled = fillTemplate(template, {
    template_name: order.templateName,
    category: order.category,
    price: order.price,
    demo_url: order.demoUrl || "-",
  });
  // Rapikan baris kosong berlebih bila admin menulis template dengan banyak enter.
  return filled.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function buildOrderUrl(number: string | null | undefined, template: string, order: OrderDetails) {
  return buildWhatsAppUrl(number, buildOrderMessage(template, order));
}
