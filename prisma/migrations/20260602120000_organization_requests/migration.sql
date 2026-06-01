-- CreateTable
CREATE TABLE "organization_requests" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterName" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_requests_orgId_status_idx" ON "organization_requests"("orgId", "status");

-- CreateIndex
CREATE INDEX "organization_requests_requesterId_status_idx" ON "organization_requests"("requesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_requests_orgId_requesterId_key" ON "organization_requests"("orgId", "requesterId");
