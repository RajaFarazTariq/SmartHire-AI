import { get } from "@vercel/blob";

import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Serves a candidate their own uploaded resume (scoped to records they own).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  const { candidateId } = await params;

  const user = await getOrCreateDbUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: user.id },
  });
  if (!candidate) return new Response("Not found", { status: 404 });

  const result = await get(candidate.fileUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type":
        CONTENT_TYPES[candidate.fileType] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(candidate.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
