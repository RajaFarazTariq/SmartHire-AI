import { get } from "@vercel/blob";

import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Streams the current candidate's primary (profile) resume.
export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile?.resumeUrl) {
    return new Response("No resume on file", { status: 404 });
  }

  const result = await get(profile.resumeUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type":
        CONTENT_TYPES[profile.resumeType ?? "pdf"] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        profile.resumeName ?? "resume",
      )}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
