"use server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";

const PAGE_SIZE = 20;

export type ActivityRule = {
  field: string;
  operator: string;
  value: string;
};

/** Translate the shared FilterBar rules into a Prisma where for activity logs. */
function buildWhere(
  orgId: string,
  rules: ActivityRule[],
): Prisma.ActivityLogWhereInput {
  const and: Prisma.ActivityLogWhereInput[] = [];

  for (const r of rules) {
    if (!r.value) continue;

    if (r.field === "type") {
      and.push(
        r.operator === "is_not" ? { type: { not: r.value } } : { type: r.value },
      );
    } else if (r.field === "user") {
      const contains: Prisma.StringFilter = {
        contains: r.value,
        mode: "insensitive",
      };
      const matchesUser: Prisma.ActivityLogWhereInput = {
        user: {
          OR: [
            { fullName: contains },
            { email: contains },
            { username: contains },
          ],
        },
      };
      and.push(r.operator === "is_not" ? { NOT: matchesUser } : matchesUser);
    } else if (r.field === "date") {
      const d = new Date(r.value);
      if (Number.isNaN(d.getTime())) continue;
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      if (r.operator === "before") and.push({ createdAt: { lt: start } });
      else if (r.operator === "after") and.push({ createdAt: { gt: end } });
      else and.push({ createdAt: { gte: start, lte: end } }); // "on"
    }
  }

  return { orgId, ...(and.length ? { AND: and } : {}) };
}

export async function getOrgActivity({
  rules = [],
  page,
}: {
  rules?: ActivityRule[];
  page?: number;
}) {
  const { orgId } = await requireWorkspace();
  const currentPage = Math.max(1, page ?? 1);
  const where = buildWhere(orgId, rules);

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
