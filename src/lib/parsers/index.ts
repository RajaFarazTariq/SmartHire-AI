import { extractPdfText } from "./pdf";
import { extractDocxText } from "./docx";

export type ResumeFileType = "pdf" | "docx";

export function detectFileType(filename: string, mimeType: string): ResumeFileType | null {
  const lower = filename.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return "docx";
  }
  return null;
}

export async function extractResumeText(
  buffer: Buffer,
  fileType: ResumeFileType,
): Promise<string> {
  if (fileType === "pdf") return extractPdfText(buffer);
  return extractDocxText(buffer);
}
