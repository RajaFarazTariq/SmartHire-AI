"use server";

import { put } from "@vercel/blob";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectFileType, extractResumeText } from "@/lib/parsers";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — under Vercel serverless body limit

export type UploadResumeResult =
  | { ok: true; candidateId: string; filename: string }
  | { ok: false; filename: string; error: string };

export async function uploadResumeAction(
  formData: FormData,
): Promise<UploadResumeResult> {
  const user = await requireDbUser();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, filename: "(unknown)", error: "No file uploaded" };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      filename: file.name,
      error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)`,
    };
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    return {
      ok: false,
      filename: file.name,
      error: "Only PDF and DOCX files are supported",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rawText: string;
  try {
    rawText = await extractResumeText(buffer, fileType);
  } catch (err) {
    return {
      ok: false,
      filename: file.name,
      error: `Failed to extract text: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  const blob = await put(`resumes/${user.id}/${file.name}`, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || (fileType === "pdf" ? "application/pdf" : undefined),
  });

  const candidate = await prisma.candidate.create({
    data: {
      userId: user.id,
      filename: file.name,
      fileUrl: blob.url,
      fileType,
      rawText,
      extractedSkills: [],
      status: "processing",
    },
  });

  return { ok: true, candidateId: candidate.id, filename: file.name };
}
