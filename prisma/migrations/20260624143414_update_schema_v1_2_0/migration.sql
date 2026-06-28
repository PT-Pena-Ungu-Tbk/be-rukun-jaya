-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('CACAT_PABRIK', 'SALAH_KIRIM', 'KUALITAS_TIDAK_SESUAI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'MANAGER';
ALTER TYPE "Role" ADD VALUE 'WAREHOUSE_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token" TEXT;

-- CreateTable
CREATE TABLE "waranty_claims" (
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

    CONSTRAINT "waranty_claims_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "waranty_claims" ADD CONSTRAINT "waranty_claims_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
