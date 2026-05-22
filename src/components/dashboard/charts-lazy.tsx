"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton() {
  return <Skeleton className="h-[220px] w-full rounded-lg" />;
}

// Recharts is heavy (~150kB); load it in its own chunk on the client only.
export const PipelineChart = dynamic(
  () => import("./charts").then((m) => m.PipelineChart),
  { ssr: false, loading: ChartSkeleton },
);

export const ScoreDistributionChart = dynamic(
  () => import("./charts").then((m) => m.ScoreDistributionChart),
  { ssr: false, loading: ChartSkeleton },
);
