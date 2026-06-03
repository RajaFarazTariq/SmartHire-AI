import { getMembers } from "./actions";
import { MembersList } from "./members-list";
import { PageHeader } from "@/components/dashboard/page-header";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div>
      <PageHeader
        title="Members"
        description="Everyone in your organization — admins, managers, recruiters — plus the people you've hired."
      />
      <MembersList members={members} />
    </div>
  );
}
