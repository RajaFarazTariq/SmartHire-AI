"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { detectFileType, extractResumeText } from "@/lib/parsers";
import { processCandidate } from "@/lib/extraction";
import { logActivity } from "@/lib/activity";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — under Vercel serverless body limit

export type UploadResumeResult =
  | { ok: true; candidateId: string; filename: string }
  | { ok: false; filename: string; error: string };

export async function uploadResumeAction(
  formData: FormData,
): Promise<UploadResumeResult> {
  const { user, orgId } = await requireWorkspace();
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
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || (fileType === "pdf" ? "application/pdf" : undefined),
  });

  const candidate = await prisma.candidate.create({
    data: {
      userId: user.id,
      orgId,
      filename: file.name,
      fileUrl: blob.url,
      fileType,
      rawText,
      extractedSkills: [],
      status: "processing",
    },
  });

  await logActivity(
    orgId,
    user.id,
    "candidate.uploaded",
    `Uploaded resume "${file.name}"`,
  );

  // Run AI extraction inline; if it fails the candidate stays "processing"
  // and can be retried from the candidate detail page.
  try {
    await processCandidate(candidate.id);
  } catch (err) {
    console.error(`AI extraction failed for ${candidate.id}:`, err);
  }

  return { ok: true, candidateId: candidate.id, filename: file.name };
}
