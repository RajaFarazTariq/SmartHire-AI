-- DropIndex
DROP INDEX "candidates_userId_stage_idx";

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "orgId" TEXT;

-- CreateIndex
CREATE INDEX "activity_logs_orgId_createdAt_idx" ON "activity_logs"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "candidates_orgId_idx" ON "candidates"("orgId");

-- CreateIndex
CREATE INDEX "candidates_orgId_stage_idx" ON "candidates"("orgId", "stage");

-- CreateIndex
CREATE INDEX "jobs_orgId_idx" ON "jobs"("orgId");
