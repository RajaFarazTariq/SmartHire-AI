import { requireDbUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDbUser();

  return (
    <DashboardShell
      email={user.email}
      username={user.username}
      fullName={user.fullName}
    >
      {children}
    </DashboardShell>
  );
}
