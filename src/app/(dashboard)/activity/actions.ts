"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";

const PAGE_SIZE = 20;

export async function getOrgActivity({
  type,
  page,
}: {
  type?: string;
  page?: number;
}) {
  const { orgId } = await requireWorkspace();
  const currentPage = Math.max(1, page ?? 1);

  const where = {
    orgId,
    ...(type && type !== "all" ? { type } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { items, total, page: currentPage, pageSize: PAGE_SIZE };
}
