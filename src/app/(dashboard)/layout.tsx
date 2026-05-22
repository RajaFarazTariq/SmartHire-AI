import { requireWorkspace } from "@/lib/org";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees an authenticated user with an active organization
  // before this renders (otherwise it redirects to /onboarding).
  const workspace = await requireWorkspace();

  return (
    <DashboardShell
      email={workspace.user.email}
      username={workspace.user.username}
      fullName={workspace.user.fullName}
      role={workspace.role}
    >
      {children}
    </DashboardShell>
  );
}
