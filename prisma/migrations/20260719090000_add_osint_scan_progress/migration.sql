DO $$
BEGIN
  CREATE TYPE "OsintScanProgressStage" AS ENUM (
    'queued',
    'harvesting',
    'ingesting',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "company_osint_scans"
  ADD COLUMN IF NOT EXISTS "progress_stage" "OsintScanProgressStage" NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS "heartbeat_at" TIMESTAMP(6);

UPDATE "company_osint_scans"
SET "progress_stage" = CASE "status"
  WHEN 'running' THEN 'harvesting'::"OsintScanProgressStage"
  WHEN 'completed' THEN 'completed'::"OsintScanProgressStage"
  WHEN 'failed' THEN 'failed'::"OsintScanProgressStage"
  ELSE 'queued'::"OsintScanProgressStage"
END
WHERE "progress_stage" = 'queued';
