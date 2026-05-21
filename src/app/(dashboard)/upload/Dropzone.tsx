"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { uploadResumeAction, type UploadResumeResult } from "./actions";
import { Card, CardContent } from "@/components/ui/card";

type FileStatus = {
  filename: string;
  state: "uploading" | "done" | "error";
  message?: string;
  candidateId?: string;
};

export default function Dropzone() {
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const router = useRouter();

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;

      const startIndex = statuses.length;
      setStatuses((prev) => [
        ...prev,
        ...accepted.map(
          (f): FileStatus => ({ filename: f.name, state: "uploading" }),
        ),
      ]);

      await Promise.all(
        accepted.map(async (file, i) => {
          const fd = new FormData();
          fd.append("file", file);
          let result: UploadResumeResult;
          try {
            result = await uploadResumeAction(fd);
          } catch (err) {
            result = {
              ok: false,
              filename: file.name,
              error: err instanceof Error ? err.message : "Upload failed",
            };
          }
          setStatuses((prev) => {
            const next = [...prev];
            next[startIndex + i] = result.ok
              ? {
                  filename: result.filename,
                  state: "done",
                  candidateId: result.candidateId,
                }
              : {
                  filename: result.filename,
                  state: "error",
                  message: result.error,
                };
            return next;
          });
          if (result.ok) {
            toast.success(`Uploaded ${result.filename}`);
          } else {
            toast.error(`${result.filename}: ${result.error}`);
          }
        }),
      );

      router.refresh();
    },
    [statuses.length, router],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: true,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <input {...getInputProps()} />
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="size-7" />
        </span>
        {isDragActive ? (
          <p className="font-medium">Drop the resumes here…</p>
        ) : (
          <>
            <p className="font-medium">
              Drag &amp; drop resumes, or click to browse
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF or DOCX · up to 4 MB each · multiple files supported
            </p>
          </>
        )}
      </div>

      {statuses.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {statuses.map((s, i) => (
              <div
                key={`${s.filename}-${i}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{s.filename}</span>
                </div>
                <StatusIndicator status={s} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: FileStatus }) {
  if (status.state === "uploading") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Processing…
      </span>
    );
  }
  if (status.state === "done") {
    return (
      <a
        href={`/candidates/${status.candidateId}`}
        className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
      >
        <CheckCircle2 className="size-3.5" /> View
      </a>
    );
  }
  return (
    <span
      className="flex max-w-[12rem] shrink-0 items-center gap-1.5 truncate text-xs text-destructive"
      title={status.message}
    >
      <AlertCircle className="size-3.5 shrink-0" />
      <span className="truncate">{status.message ?? "Failed"}</span>
    </span>
  );
}
