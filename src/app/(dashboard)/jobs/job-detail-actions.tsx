"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteJobDialog } from "./delete-job-dialog";

export function JobDetailActions({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/jobs/${jobId}/edit`}>
          <Pencil className="size-4" /> Edit
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4" /> Delete
      </Button>

      <DeleteJobDialog
        jobId={jobId}
        jobTitle={jobTitle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectTo="/jobs"
      />
    </div>
  );
}
