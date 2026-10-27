-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('nueva', 'en_revision', 'cotizada', 'cerrada', 'descartada');

-- CreateEnum
CREATE TYPE "GeometryMode" AS ENUM ('cad', 'muestra');

-- CreateEnum
CREATE TYPE "CncMaterialKind" AS ENUM ('alloy', 'polymer');

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" UUID NOT NULL,
    "folio" SERIAL NOT NULL,
    "project_code" TEXT NOT NULL,
    "public_code" TEXT,
    "submission_key" UUID NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "alloy_id" TEXT,
    "polymer_id" TEXT NOT NULL,
    "geometry_mode" "GeometryMode" NOT NULL,
    "size_start" SMALLINT NOT NULL,
    "size_end" SMALLINT NOT NULL,
    "pairs" SMALLINT NOT NULL,
    "note" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_company" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "privacy_accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "shrinkage_pct" DECIMAL(5,2) NOT NULL,
    "calc_version" TEXT NOT NULL,
    "is_special_case" BOOLEAN NOT NULL DEFAULT false,
    "special_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_spam" BOOLEAN NOT NULL DEFAULT false,
    "status" "QuoteStatus" NOT NULL DEFAULT 'nueva',
    "status_changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymized_at" TIMESTAMPTZ(6),

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnc_materials" (
    "id" TEXT NOT NULL,
    "kind" "CncMaterialKind" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "shrinkage_pct" DECIMAL(5,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cnc_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_folio_key" ON "quote_requests"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_public_code_key" ON "quote_requests"("public_code");

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_submission_key_key" ON "quote_requests"("submission_key");

-- CreateIndex
CREATE INDEX "quote_requests_status_created_at_idx" ON "quote_requests"("status", "created_at" DESC);

-- Constraints que Prisma no expresa en el schema (ADR-0005). Respaldan la validación Zod.
ALTER TABLE "quote_requests"
  ADD CONSTRAINT "quote_requests_sizes_check" CHECK ("size_start" BETWEEN 15 AND 50 AND "size_end" BETWEEN 15 AND 50 AND "size_end" >= "size_start"),
  ADD CONSTRAINT "quote_requests_pairs_check" CHECK ("pairs" = "size_end" - "size_start" + 1),
  ADD CONSTRAINT "quote_requests_contact_check" CHECK ("contact_email" IS NOT NULL OR "contact_phone" IS NOT NULL);
