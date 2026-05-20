"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { uploadResumeAction, type UploadResumeResult } from "./actions";

type FileStatus = {
  filename: string;
  state: "pending" | "uploading" | "done" | "error";
  message?: string;
  candidateId?: string;
};

export default function Dropzone() {
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const router = useRouter();

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;

      const initial: FileStatus[] = accepted.map((f) => ({
        filename: f.name,
        state: "uploading",
      }));
      const startIndex = statuses.length;
      setStatuses((prev) => [...prev, ...initial]);

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
    <div>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-gray-700">Drop the resumes here…</p>
        ) : (
          <>
            <p className="font-medium text-gray-700">
              Drag and drop resumes here, or click to browse
            </p>
            <p className="mt-1 text-sm text-gray-500">
              PDF or DOCX, up to 4 MB each
            </p>
          </>
        )}
      </div>

      {statuses.length > 0 && (
        <ul className="mt-6 divide-y divide-gray-200 rounded-md border border-gray-200">
          {statuses.map((s, i) => (
            <li
              key={`${s.filename}-${i}`}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <span className="truncate text-gray-800">{s.filename}</span>
              <StateBadge status={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StateBadge({ status }: { status: FileStatus }) {
  if (status.state === "uploading") {
    return <span className="text-xs text-gray-500">Uploading…</span>;
  }
  if (status.state === "done") {
    return (
      <a
        href={`/candidates/${status.candidateId}`}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        View →
      </a>
    );
  }
  if (status.state === "error") {
    return (
      <span className="max-w-xs truncate text-xs text-red-600" title={status.message}>
        {status.message ?? "Failed"}
      </span>
    );
  }
  return <span className="text-xs text-gray-400">Pending</span>;
}
