import "server-only";

import { prisma } from "./prisma";

/**
 * Number of UNIQUE candidates (people) in an org — distinct applicant accounts
 * across applications, matching the Candidates page's account-based dedup.
 *
 * One applicant who applied to N jobs has N candidate rows but is a single
 * candidate, so we count distinct applicantIds rather than candidate rows.
 * Use this everywhere a "Candidates" headcount is shown (dashboard KPI, org
 * stats, etc.) so the numbers always agree with the Candidates page.
 */
export async function countOrgCandidates(orgId: string): Promise<number> {
  const rows = await prisma.application.findMany({
    where: { candidate: { orgId } },
    distinct: ["applicantId"],
    select: { applicantId: true },
  });
  return rows.length;
}
