import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_CONTENT, contentToRows, mergeContent } from "../src/lib/content/schema";
import { mergeSettings, instagramUrl } from "../src/lib/settings/schema";
import { slugify } from "../src/lib/slug";
import { parseCatalogQuery, templateSchema } from "../src/lib/validation/catalog";

describe("slugify", () => {
  it("membuat slug SEO-friendly", () => {
    assert.equal(slugify("Elegant Rose"), "elegant-rose");
    assert.equal(slugify("Lumière Classic!"), "lumiere-classic");
    assert.equal(slugify("Aqiqah & Syukuran"), "aqiqah-dan-syukuran");
    assert.equal(slugify("  --Petite   Soirée-- "), "petite-soiree");
  });
});

describe("mergeContent", () => {
  it("memakai nilai database bila valid", () => {
    const content = mergeContent([{ section: "hero", key: "headline", value: "Cerita Kalian, Diundang dengan Indah." }]);
    assert.equal(content.hero.headline, "Cerita Kalian, Diundang dengan Indah.");
    assert.equal(content.hero.primaryCta, DEFAULT_CONTENT.hero.primaryCta);
  });

  it("jatuh ke default bila JSON item rusak atau tidak valid", () => {
    const broken = mergeContent([{ section: "whyUs", key: "items", value: "{bukan json" }]);
    assert.deepEqual(broken.whyUs.items, DEFAULT_CONTENT.whyUs.items);
    const invalid = mergeContent([{ section: "whyUs", key: "items", value: "[]" }]);
    assert.deepEqual(invalid.whyUs.items, DEFAULT_CONTENT.whyUs.items);
  });

  it("round-trip baris konten", () => {
    const rows = contentToRows("howItWorks", DEFAULT_CONTENT.howItWorks);
    assert.deepEqual(mergeContent(rows).howItWorks, DEFAULT_CONTENT.howItWorks);
  });
});

describe("settings", () => {
  it("mengisi default dan mengabaikan key asing", () => {
    const settings = mergeSettings([
      { key: "brandName", value: "Heaven Inv" },
      { key: "whatsappMessage", value: "" },
      { key: "evil", value: "x" },
    ]);
    assert.ok(settings.whatsappMessage.includes("{{template_name}}"));
    assert.equal((settings as Record<string, unknown>).evil, undefined);
  });

  it("membentuk URL Instagram dari username", () => {
    assert.equal(instagramUrl("@heaveninv"), "https://instagram.com/heaveninv");
    assert.equal(instagramUrl(""), null);
  });
});

describe("validasi template", () => {
  const base = {
    name: "Elegant Rose",
    slug: "elegant-rose",
    description: "",
    categoryId: "cat_1",
    price: "149000",
    thumbnail: "/media/2026/10/a.webp",
    gallery: [],
    demoUrl: "",
    tags: ["best-seller"],
    features: [],
    isFeatured: "on",
    isPublished: null,
  };

  it("menerima input valid dan mengubah tipe", () => {
    const parsed = templateSchema.parse(base);
    assert.equal(parsed.price, 149000);
    assert.equal(parsed.isFeatured, true);
    assert.equal(parsed.isPublished, false);
    assert.deepEqual(parsed.tags, ["best-seller"]);
  });

  it("harga coret promo harus lebih besar dari harga promo", () => {
    const valid = templateSchema.safeParse({ ...base, tags: ["promo"], originalPrice: "179.000" });
    assert.equal(valid.success, true);
    assert.equal(valid.data!.originalPrice, 179000);
    const invalid = templateSchema.safeParse({ ...base, tags: ["promo"], originalPrice: "100000" });
    assert.equal(invalid.success, false);
    assert.ok(invalid.error!.issues.some((issue) => issue.path.join(".") === "originalPrice"));
    // Tanpa tag Promo, harga coret diabaikan (tidak divalidasi).
    assert.equal(templateSchema.safeParse({ ...base, tags: [], originalPrice: "100000" }).success, true);
  });

  it("menolak tag di luar daftar", () => {
    const result = templateSchema.safeParse({ ...base, tags: ["viral"] });
    assert.equal(result.success, false);
  });

  it("menolak harga kosong, slug tidak valid, dan URL berbahaya", () => {
    const result = templateSchema.safeParse({ ...base, price: "", slug: "Bukan Slug", demoUrl: "javascript:alert(1)" });
    assert.equal(result.success, false);
    const paths = result.error!.issues.map((issue) => issue.path.join("."));
    assert.ok(paths.includes("price"));
    assert.ok(paths.includes("slug"));
    assert.ok(paths.includes("demoUrl"));
  });
});

describe("parseCatalogQuery", () => {
  it("menormalkan searchParams yang aneh", () => {
    assert.deepEqual(parseCatalogQuery({ q: "  rose ", sort: "hack", page: "-3", tag: "Best-Seller", category: ["Wedding", "x"] }), {
      q: "rose",
      category: "wedding",
      sort: "recommended",
      tag: "best-seller",
      page: 1,
    });
  });

  it("mengabaikan tag yang tidak dikenal", () => {
    assert.equal(parseCatalogQuery({ tag: "viral" }).tag, "");
  });
});
