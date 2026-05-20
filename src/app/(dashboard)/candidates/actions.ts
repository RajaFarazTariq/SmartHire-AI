"use server";

import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getUserCandidates() {
  const user = await requireDbUser();
  return prisma.candidate.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function getCandidate(id: string) {
  const user = await requireDbUser();
  return prisma.candidate.findFirst({
    where: { id, userId: user.id },
  });
}
