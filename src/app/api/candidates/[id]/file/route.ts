import { get } from "@vercel/blob";

import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireDbUser();

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
  });
  if (!candidate) {
    return new Response("Not found", { status: 404 });
  }

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
