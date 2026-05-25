-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 45,
    "type" TEXT NOT NULL DEFAULT 'Phone Screen',
    "meetingLink" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "interviewerIds" TEXT[],
    "aiQuestions" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_feedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "recommendation" TEXT NOT NULL,
    "strengths" TEXT,
    "concerns" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interviews_orgId_scheduledAt_idx" ON "interviews"("orgId", "scheduledAt");

-- CreateIndex
CREATE INDEX "interviews_candidateId_idx" ON "interviews"("candidateId");

-- CreateIndex
CREATE INDEX "interviews_jobId_idx" ON "interviews"("jobId");

-- CreateIndex
CREATE INDEX "interview_feedback_interviewId_idx" ON "interview_feedback"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_feedback_interviewId_interviewerId_key" ON "interview_feedback"("interviewId", "interviewerId");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
