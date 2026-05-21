"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. You can retry, or
          go back to the dashboard.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="size-4" /> Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Back to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
