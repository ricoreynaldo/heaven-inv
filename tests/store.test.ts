import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveStoreDriver } from "../src/lib/store/driver";
import { EMPTY_DATABASE, isEmptyPlan, planWrites } from "../src/lib/store/plan";
import type { Database, TemplateRecord } from "../src/lib/store/types";

const template = (id: string, overrides: Partial<TemplateRecord> = {}): TemplateRecord => ({
  id,
  name: `Undangan ${id}`,
  slug: `undangan-${id}`,
  description: "",
  price: 100000,
  originalPrice: null,
  thumbnail: `/seed/${id}.webp`,
  demoUrl: null,
  tags: [],
  features: [],
  isFeatured: false,
  isPublished: true,
  sortOrder: 1,
  categoryId: "c1",
  images: [],
  createdAt: "2026-10-10T00:00:00.000Z",
  updatedAt: "2026-10-10T00:00:00.000Z",
  ...overrides,
});

const db = (overrides: Partial<Database> = {}): Database => ({ ...structuredClone(EMPTY_DATABASE), ...overrides });

describe("resolveStoreDriver", () => {
  it("laptop tanpa DATA_STORE tetap dummy walau .env berisi DATABASE_URL", () => {
    assert.equal(resolveStoreDriver({ DATABASE_URL: "postgresql://localhost/x" }), "json");
  });
  it("Vercel dengan DATABASE_URL otomatis memakai Postgres", () => {
    assert.equal(resolveStoreDriver({ VERCEL: "1", DATABASE_URL: "postgresql://neon/x" }), "postgres");
  });
  it("Vercel tanpa DATABASE_URL jatuh ke dummy", () => {
    assert.equal(resolveStoreDriver({ VERCEL: "1" }), "json");
  });
  it("DATA_STORE memaksa pilihan, postgres wajib DATABASE_URL", () => {
    assert.equal(resolveStoreDriver({ DATA_STORE: "postgres", DATABASE_URL: "postgresql://x" }), "postgres");
    assert.equal(resolveStoreDriver({ DATA_STORE: "dummy", VERCEL: "1", DATABASE_URL: "postgresql://x" }), "json");
    assert.throws(() => resolveStoreDriver({ DATA_STORE: "postgres" }), /DATABASE_URL/);
  });
});

describe("planWrites", () => {
  it("snapshot sama → tidak ada yang ditulis", () => {
    const snapshot = db({ templates: [template("t1")], content: [{ section: "hero", key: "headline", value: "Heaven Inv" }] });
    assert.ok(isEmptyPlan(planWrites(snapshot, structuredClone(snapshot))));
  });

  it("urutan kolom & undefined vs null tidak dianggap perubahan", () => {
    const before = db({ templates: [template("t1")] });
    const withoutPrice: Partial<TemplateRecord> = template("t1");
    delete withoutPrice.originalPrice;
    const reordered = Object.fromEntries(Object.entries(withoutPrice).reverse()) as TemplateRecord;
    assert.ok(isEmptyPlan(planWrites(before, db({ templates: [reordered] }))));
  });

  it("hanya baris yang berubah yang di-upsert, yang hilang dihapus", () => {
    const before = db({ templates: [template("t1"), template("t2"), template("t3")] });
    const after = structuredClone(before);
    after.templates[0]!.price = 99000;
    after.templates = after.templates.filter((row) => row.id !== "t3");
    after.templates.push(template("t4"));
    const plan = planWrites(before, after);
    assert.deepEqual(plan.templates.upsert.map((row) => row.id), ["t1", "t4"]);
    assert.deepEqual(plan.templates.remove, ["t3"]);
    assert.equal(plan.categories.upsert.length, 0);
  });

  it("perubahan galeri ikut menandai template berubah", () => {
    const before = db({ templates: [template("t1", { images: [{ id: "i1", url: "/a.webp", sortOrder: 0 }] })] });
    const after = structuredClone(before);
    after.templates[0]!.images.push({ id: "i2", url: "/b.webp", sortOrder: 1 });
    assert.deepEqual(planWrites(before, after).templates.upsert.map((row) => row.id), ["t1"]);
  });

  it("konten & pengaturan dibandingkan per kunci", () => {
    const before = db({
      content: [
        { section: "hero", key: "headline", value: "Lama" },
        { section: "about", key: "image", value: "/x.webp" },
      ],
      settings: [{ key: "whatsappNumber", value: "628" }],
    });
    const after = db({
      content: [{ section: "hero", key: "headline", value: "Heaven Inv" }],
      settings: [
        { key: "whatsappNumber", value: "628" },
        { key: "email", value: "halo@heaveninv.id" },
      ],
    });
    const plan = planWrites(before, after);
    assert.deepEqual(plan.content.upsert, [{ section: "hero", key: "headline", value: "Heaven Inv" }]);
    assert.deepEqual(plan.content.remove, [{ section: "about", key: "image" }]);
    assert.deepEqual(plan.settings.upsert.map((row) => row.key), ["email"]);
    assert.deepEqual(plan.settings.remove, []);
  });
});
