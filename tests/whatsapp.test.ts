import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_WHATSAPP_MESSAGE } from "../src/lib/settings/schema";
import { buildOrderMessage, buildOrderUrl, buildWhatsAppUrl, fillTemplate, normalizeWhatsAppNumber } from "../src/lib/whatsapp";

describe("normalizeWhatsAppNumber", () => {
  it("mengubah format lokal Indonesia ke format wa.me", () => {
    assert.equal(normalizeWhatsAppNumber("0812-3456-7890"), "6281234567890");
    assert.equal(normalizeWhatsAppNumber("+62 812 3456 7890"), "6281234567890");
    assert.equal(normalizeWhatsAppNumber("6281234567890"), "6281234567890");
    assert.equal(normalizeWhatsAppNumber("81234567890"), "6281234567890");
  });

  it("menolak input yang bukan nomor telepon", () => {
    assert.equal(normalizeWhatsAppNumber(""), null);
    assert.equal(normalizeWhatsAppNumber("abc"), null);
    assert.equal(normalizeWhatsAppNumber("123"), null);
    assert.equal(normalizeWhatsAppNumber(undefined), null);
  });
});

describe("fillTemplate", () => {
  it("mengganti placeholder yang dikenal dan membiarkan yang lain", () => {
    assert.equal(fillTemplate("{{ template_name }} - {{unknown}}", { template_name: "Elegant Rose" }), "Elegant Rose - {{unknown}}");
  });
});

describe("buildOrderUrl", () => {
  const order = {
    templateName: "Elegant Rose",
    category: "Wedding",
    price: "Rp 149.000",
    demoUrl: "https://heaveninv.id/demo/elegant-rose",
  };

  it("memakai nomor dari settings dan pesan yang ter-encode", () => {
    const url = buildOrderUrl("0812 3456 7890", DEFAULT_WHATSAPP_MESSAGE, order);
    assert.ok(url);
    const parsed = new URL(url);
    assert.equal(parsed.origin, "https://wa.me");
    assert.equal(parsed.pathname, "/6281234567890");
    const text = parsed.searchParams.get("text") ?? "";
    assert.match(text, /Template: Elegant Rose/);
    assert.match(text, /Kategori: Wedding/);
    assert.match(text, /Harga: Rp 149\.000/);
    assert.match(text, /Demo: https:\/\/heaveninv\.id\/demo\/elegant-rose/);
    // Tidak ada karakter mentah yang merusak URL.
    assert.ok(!url.includes(" "));
    assert.ok(!url.includes("\n"));
    assert.equal(decodeURIComponent(url.split("?text=")[1]!), text);
  });

  it("menulis '-' bila template tidak punya demo", () => {
    assert.match(buildOrderMessage(DEFAULT_WHATSAPP_MESSAGE, { ...order, demoUrl: "" }), /Demo: -/);
  });

  it("mengembalikan null bila nomor belum valid", () => {
    assert.equal(buildOrderUrl("", DEFAULT_WHATSAPP_MESSAGE, order), null);
    assert.equal(buildWhatsAppUrl("abc", "halo"), null);
  });
});
