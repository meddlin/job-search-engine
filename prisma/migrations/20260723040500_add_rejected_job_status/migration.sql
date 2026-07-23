ALTER TABLE "job_applications"
DROP CONSTRAINT IF EXISTS "job_applications_status_check";

ALTER TABLE "job_applications"
ADD CONSTRAINT "job_applications_status_check"
CHECK (
  "status" IS NULL
  OR "status" IN (
    'initiation',
    'phone_screen',
    'apply',
    'interviewing',
    'offer_accept',
    'rejected'
  )
);
