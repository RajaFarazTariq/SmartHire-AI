-- CreateTable: track founder of each Clerk org to enforce "original admin is permanent".
CREATE TABLE "organizations" (
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "foundedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("orgId")
);

-- Unique index on name for soft collision detection on first ensureOrgRecord() call.
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- Index for "is this user the founder of any org?" lookups.
CREATE INDEX "organizations_foundedById_idx" ON "organizations"("foundedById");
