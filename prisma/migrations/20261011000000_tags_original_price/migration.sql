-- Badge tunggal diganti tag katalog (bisa lebih dari satu) + harga coret untuk promo.
-- Badge lama dipindahkan dulu ke tag supaya data yang sudah ada tidak hilang.

-- AlterTable
ALTER TABLE "templates"
ADD COLUMN     "original_price" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "templates"
SET "tags" = CASE lower(trim("badge"))
    WHEN 'terlaris' THEN ARRAY['best-seller']
    WHEN 'best seller' THEN ARRAY['best-seller']
    WHEN 'baru' THEN ARRAY['new']
    WHEN 'new' THEN ARRAY['new']
    WHEN 'promo' THEN ARRAY['promo']
    WHEN 'premium' THEN ARRAY['premium']
    ELSE ARRAY[]::TEXT[]
END
WHERE "badge" IS NOT NULL;

ALTER TABLE "templates" DROP COLUMN "badge";
