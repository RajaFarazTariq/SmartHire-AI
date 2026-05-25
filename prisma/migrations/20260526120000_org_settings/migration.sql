-- CreateTable
CREATE TABLE "org_settings" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "enabledRounds" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_settings_orgId_key" ON "org_settings"("orgId");
