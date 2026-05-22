import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees an authenticated user (no org required) before this renders.
  const user = await requireDbUser();
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return <PortalShell unreadCount={unreadCount}>{children}</PortalShell>;
}
