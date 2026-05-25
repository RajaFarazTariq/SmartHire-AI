import { redirect } from "next/navigation";

import { requireDbUser } from "@/lib/auth";
import { getActiveOrgId, hasOrgMembership } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees an authenticated user (no org required) before this renders.
  const user = await requireDbUser();

  // Strict separation: recruiters/admins (anyone who belongs to an organization)
  // must never enter the candidate portal — route them to the recruiter app.
  if ((await getActiveOrgId()) || (await hasOrgMembership(user.id))) {
    redirect("/dashboard");
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return <PortalShell unreadCount={unreadCount}>{children}</PortalShell>;
}
