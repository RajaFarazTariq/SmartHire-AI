"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { countOrgCandidates } from "@/lib/candidate-stats";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/pipeline";

const SCORE_BUCKETS = [
  { range: "0–24", min: 0, max: 25 },
  { range: "25–49", min: 25, max: 50 },
  { range: "50–74", min: 50, max: 75 },
  { range: "75–100", min: 75, max: 101 },
];

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
const TREND_WEEKS = 8;

export type RecentUpload = {
  id: string;
  fullName: string | null;
  filename: string;
  currentTitle: string | null;
  status: string;
  stage: string;
  uploadedAt: Date;
};

export async function getDashboardStats() {
  const { user, orgId } = await requireWorkspace();
  const where = { orgId };
  const scoreWhere = { job: { orgId } };

  // Monday 00:00 of the current week, then the window covering TREND_WEEKS back.
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const trendSince = new Date(weekStart.getTime() - (TREND_WEEKS - 1) * MS_WEEK);

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
    trendRows,
    recentUploads,
  ] = await Promise.all([
    prisma.job.count({ where }),
    // "Candidates" = unique PEOPLE (distinct applicants), not resume rows.
    countOrgCandidates(orgId),
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
    prisma.candidate.findMany({
      where: { ...where, uploadedAt: { gte: trendSince } },
      select: { uploadedAt: true },
    }),
    prisma.candidate.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      take: 6,
      select: {
        id: true,
        fullName: true,
        filename: true,
        currentTitle: true,
        status: true,
        stage: true,
        uploadedAt: true,
      },
    }),
  ]);

  // Bucket uploads into weekly counts for the trend chart.
  const weekBuckets = Array.from({ length: TREND_WEEKS }, (_, i) => {
    const start = new Date(weekStart.getTime() - (TREND_WEEKS - 1 - i) * MS_WEEK);
    return {
      start: start.getTime(),
      week: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    };
  });
  for (const r of trendRows) {
    const t = new Date(r.uploadedAt).getTime();
    for (let i = weekBuckets.length - 1; i >= 0; i--) {
      if (t >= weekBuckets[i].start) {
        weekBuckets[i].count++;
        break;
      }
    }
  }
  const weeklyTrend = weekBuckets.map((b) => ({ week: b.week, count: b.count }));
  const thisWeekUploads = weekBuckets[TREND_WEEKS - 1].count;
  const lastWeekUploads = weekBuckets[TREND_WEEKS - 2].count;
  const velocityDelta =
    lastWeekUploads === 0
      ? thisWeekUploads > 0
        ? 100
        : 0
      : Math.round(((thisWeekUploads - lastWeekUploads) / lastWeekUploads) * 100);

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
    weeklyTrend,
    recentUploads,
    upcomingInterviews:
      stageCounts["Interview Scheduled"] + stageCounts["Technical Assessment"],
    pendingReviews: stageCounts.Applied + stageCounts["Under Review"],
    velocity: {
      thisWeek: thisWeekUploads,
      lastWeek: lastWeekUploads,
      deltaPct: velocityDelta,
    },
  };
}
