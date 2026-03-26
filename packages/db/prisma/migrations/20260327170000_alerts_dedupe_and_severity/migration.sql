-- Extend AlertSeverity (safe if re-run after partial apply).
DO $$ BEGIN
  ALTER TYPE "AlertSeverity" ADD VALUE 'INFO';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "AlertSeverity" ADD VALUE 'WARNING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "alerts" ADD COLUMN "dedupe_key" TEXT;

UPDATE "alerts" SET "dedupe_key" = "id" WHERE "dedupe_key" IS NULL;

ALTER TABLE "alerts" ALTER COLUMN "dedupe_key" SET NOT NULL;

CREATE UNIQUE INDEX "alerts_user_id_dedupe_key_key" ON "alerts"("user_id", "dedupe_key");
