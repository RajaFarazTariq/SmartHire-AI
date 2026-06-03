import Link from "next/link";
import { UploadCloud } from "lucide-react";

import { getCandidateDirectory } from "./actions";
import { CandidatesDirectory } from "./candidates-directory";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = await getCandidateDirectory();

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Every person who's applied to your jobs, deduplicated and organized."
      >
        <Button asChild>
          <Link href="/upload">
            <UploadCloud className="size-4" /> Upload resumes
          </Link>
        </Button>
      </PageHeader>
      <CandidatesDirectory candidates={candidates} />
    </div>
  );
}
