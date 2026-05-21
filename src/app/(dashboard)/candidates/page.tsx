import Link from "next/link";
import { UploadCloud } from "lucide-react";

import { getUserCandidates } from "./actions";
import { CandidatesList } from "./candidates-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default async function CandidatesPage() {
  const candidates = await getUserCandidates();

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Resumes you've uploaded and parsed."
      >
        <Button asChild>
          <Link href="/upload">
            <UploadCloud className="size-4" /> Upload resumes
          </Link>
        </Button>
      </PageHeader>
      <CandidatesList candidates={candidates} />
    </div>
  );
}
