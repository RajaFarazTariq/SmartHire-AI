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
        description="People who signed up through the candidate portal but haven't applied to a job yet. They become candidates on their first application."
      />
      <MembersList members={members} />
    </div>
  );
}
