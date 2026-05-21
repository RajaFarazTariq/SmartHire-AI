"use server";

import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/pipeline";

const SCORE_BUCKETS = [
  { range: "0–24", min: 0, max: 25 },
  { range: "25–49", min: 25, max: 50 },
  { range: "50–74", min: 50, max: 75 },
  { range: "75–100", min: 75, max: 101 },
];

export async function getDashboardStats() {
  const user = await requireDbUser();
  const where = { userId: user.id };
  const scoreWhere = { job: { userId: user.id } };

  const [
    jobCount,
    candidateCount,
    processingCount,
    readyCount,
    stageGroups,
    avgAgg,
    scoreRows,
    recentActivity,
    topMatches,
  ] = await Promise.all([
    prisma.job.count({ where }),
    prisma.candidate.count({ where }),
    prisma.candidate.count({ where: { ...where, status: "processing" } }),
    prisma.candidate.count({ where: { ...where, status: "ready" } }),
    prisma.candidate.groupBy({
      by: ["stage"],
      where,
      _count: { _all: true },
    }),
    prisma.score.aggregate({
      where: scoreWhere,
      _avg: { overallScore: true },
    }),
    prisma.score.findMany({
      where: scoreWhere,
      select: { overallScore: true },
    }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.score.findMany({
      where: scoreWhere,
      include: { candidate: true, job: true },
      orderBy: { overallScore: "desc" },
      take: 5,
    }),
  ]);

  // Stage counts with every stage present (0-filled).
  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s, 0]),
  ) as Record<PipelineStage, number>;
  for (const g of stageGroups) {
    if (g.stage in stageCounts) {
      stageCounts[g.stage as PipelineStage] = g._count._all;
    }
  }

  // Score distribution buckets.
  const scoreDistribution = SCORE_BUCKETS.map((b) => ({
    range: b.range,
    count: scoreRows.filter(
      (r) => r.overallScore >= b.min && r.overallScore < b.max,
    ).length,
  }));

  return {
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    jobCount,
    candidateCount,
    processingCount,
    readyCount,
    hiredCount: stageCounts.Hired,
    avgMatchScore: Math.round(avgAgg._avg.overallScore ?? 0),
    scoredCount: scoreRows.length,
    stageCounts,
    scoreDistribution,
    recentActivity,
    topMatches,
  };
}
