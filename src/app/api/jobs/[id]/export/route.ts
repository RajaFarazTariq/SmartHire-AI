import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireDbUser();

  const job = await prisma.job.findFirst({
    where: { id, userId: user.id },
  });
  if (!job) {
    return new Response("Not found", { status: 404 });
  }

  const scores = await prisma.score.findMany({
    where: { jobId: id },
    include: { candidate: true },
    orderBy: { overallScore: "desc" },
  });

  const header = [
    "Rank",
    "Candidate",
    "Current title",
    "Email",
    "Overall",
    "Semantic",
    "Skills",
    "Experience",
    "Matched skills",
    "Missing skills",
  ];

  const rows = scores.map((s, i) => [
    i + 1,
    s.candidate.fullName ?? s.candidate.filename,
    s.candidate.currentTitle ?? "",
    s.candidate.email ?? "",
    Math.round(s.overallScore),
    Math.round(s.semanticScore),
    Math.round(s.skillMatchScore),
    Math.round(s.experienceScore),
    s.matchedSkills.join("; "),
    s.missingSkills.join("; "),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  const slug =
    job.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() ||
    "job";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-ranking.csv"`,
    },
  });
}
