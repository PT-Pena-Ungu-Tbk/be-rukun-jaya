/*
  Warnings:

  - You are about to drop the `waranty_claims` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "waranty_claims" DROP CONSTRAINT "waranty_claims_product_id_fkey";

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "level" VARCHAR(50) NOT NULL DEFAULT 'Bronze',
ADD COLUMN     "poin" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "waranty_claims";

-- CreateTable
CREATE TABLE "warranty_claims" (
    "id" TEXT NOT NULL,
    "invoice_id" VARCHAR(255) NOT NULL,
    "product_id" UUID NOT NULL,
    "alasan_retur" "ReturnReason" NOT NULL,
    "qty_diretur" INTEGER NOT NULL,
    "deskripsi_kondisi" TEXT,
    "status" "ClaimStatus" NOT NULL,
    "estimasi_nilai_retur" INTEGER NOT NULL,
    "stok_berkurang" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
