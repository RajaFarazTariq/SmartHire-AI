import { redirect } from "next/navigation";

import { requireWorkspace } from "@/lib/org";
import { isValidName } from "@/lib/validators/name";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees an authenticated user with an active organization
  // before this renders (otherwise it redirects to /onboarding).
  const workspace = await requireWorkspace();

  // Name-gate: also enforce here so navigating straight to /dashboard (not via
  // /continue) still requires a valid display name.
  if (!isValidName(workspace.user.fullName)) redirect("/welcome");

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
