DO $$
BEGIN
  CREATE TYPE "OsintScanStatus" AS ENUM ('queued', 'running', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "company_osint_scans" (
  "id" SERIAL NOT NULL,
  "company_name" VARCHAR(255) NOT NULL,
  "domain" VARCHAR(255) NOT NULL,
  "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "limit" INTEGER NOT NULL DEFAULT 100,
  "status" "OsintScanStatus" NOT NULL DEFAULT 'queued',
  "started_at" TIMESTAMP(6),
  "completed_at" TIMESTAMP(6),
  "output_directory" VARCHAR(1000),
  "output_json_path" VARCHAR(1000),
  "output_xml_path" VARCHAR(1000),
  "host_count" INTEGER NOT NULL DEFAULT 0,
  "email_count" INTEGER NOT NULL DEFAULT 0,
  "ip_count" INTEGER NOT NULL DEFAULT 0,
  "url_count" INTEGER NOT NULL DEFAULT 0,
  "person_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "raw_result" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,

  CONSTRAINT "company_osint_scans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "company_osint_findings" (
  "id" SERIAL NOT NULL,
  "scan_id" INTEGER NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "value" VARCHAR(1000) NOT NULL,
  "source" VARCHAR(255),
  "metadata" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_osint_findings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_osint_scans_domain_idx" ON "company_osint_scans"("domain");
CREATE INDEX IF NOT EXISTS "company_osint_scans_status_idx" ON "company_osint_scans"("status");
CREATE INDEX IF NOT EXISTS "company_osint_findings_type_idx" ON "company_osint_findings"("type");
CREATE INDEX IF NOT EXISTS "company_osint_findings_value_idx" ON "company_osint_findings"("value");
CREATE UNIQUE INDEX IF NOT EXISTS "company_osint_findings_scan_id_type_value_key"
  ON "company_osint_findings"("scan_id", "type", "value");

DO $$
BEGIN
  ALTER TABLE "company_osint_findings"
    ADD CONSTRAINT "company_osint_findings_scan_id_fkey"
    FOREIGN KEY ("scan_id")
    REFERENCES "company_osint_scans"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
