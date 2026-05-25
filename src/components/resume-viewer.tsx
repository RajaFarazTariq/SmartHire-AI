"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ResumeViewer({
  fileType,
  fileName,
  fileUrl,
  height = 600,
}: {
  fileType: string;
  fileName: string;
  /** Raw-file endpoint (DOCX HTML is fetched from `${fileUrl}?format=html`). */
  fileUrl: string;
  height?: number;
}) {
  const isPdf = fileType === "pdf";
  const isDocx = fileType === "docx";

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(isDocx);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isDocx) return;
    let active = true;
    setLoading(true);
    setError(false);
    fetch(`${fileUrl}?format=html`)
      .then(async (r) => {
        if (!r.ok) throw new Error("render failed");
        return r.text();
      })
      .then((text) => {
        if (active) {
          setHtml(text);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fileUrl, isDocx, reloadKey]);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {fileType.toUpperCase()} document
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isDocx && !loading && !error && (
            <div className="mr-1 hidden items-center gap-0.5 sm:flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(2)))}
                disabled={zoom <= 0.7}
                aria-label="Zoom out"
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}
                disabled={zoom >= 1.6}
                aria-label="Zoom in"
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Open
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-9">
            <a href={fileUrl} download={fileName} aria-label="Download">
              <Download className="size-4" />
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isPdf ? (
          <iframe
            src={fileUrl}
            title={fileName}
            className="w-full bg-muted/30"
            style={{ height }}
          />
        ) : isDocx ? (
          loading ? (
            <DocxSkeleton height={height} />
          ) : error ? (
            <ViewerFallback
              height={height}
              fileUrl={fileUrl}
              message="We couldn't render this document."
              onRetry={() => setReloadKey((k) => k + 1)}
            />
          ) : (
            <div className="overflow-auto bg-muted/20" style={{ height }}>
              <div className="mx-auto my-6 max-w-3xl rounded-lg border bg-card p-6 shadow-sm sm:p-8">
                <div
                  className="docx-preview"
                  style={{ fontSize: `${0.95 * zoom}rem` }}
                  dangerouslySetInnerHTML={{ __html: html ?? "" }}
                />
              </div>
            </div>
          )
        ) : (
          <ViewerFallback
            height={height}
            fileUrl={fileUrl}
            message="Inline preview isn't available for this file type."
          />
        )}
      </CardContent>
    </Card>
  );
}

function DocxSkeleton({ height }: { height: number }) {
  return (
    <div className="overflow-hidden bg-muted/20" style={{ height }}>
      <div className="mx-auto my-6 max-w-3xl space-y-4 rounded-lg border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Rendering document…
        </div>
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-3.5"
              style={{ width: `${90 - (i % 3) * 12}%` }}
            />
          ))}
        </div>
        <Skeleton className="mt-4 h-5 w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5" style={{ width: `${85 - (i % 2) * 18}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewerFallback({
  height,
  fileUrl,
  message,
  onRetry,
}: {
  height: number;
  fileUrl: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 bg-muted/20 text-center"
      style={{ height }}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AlertCircle className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Button asChild size="sm">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" /> Open file
          </a>
        </Button>
      </div>
    </div>
  );
}
