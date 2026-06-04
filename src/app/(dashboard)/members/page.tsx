import { getMembers } from "./actions";
import { MembersList } from "./members-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireWorkspace } from "@/lib/org";
import { isAdmin } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [members, ws] = await Promise.all([getMembers(), requireWorkspace()]);

  return (
    <div>
      <PageHeader
        title="Members"
        description="Everyone in your organization — admins, managers, recruiters — plus the people you've hired."
      />
      <MembersList
        members={members}
        canManageRoles={isAdmin(ws.role)}
        currentUserId={ws.user.id}
      />
    </div>
  );
}
