"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteOrganizationAction,
  getOrgDeletionPreview,
  type DeletionPreview,
} from "@/app/(dashboard)/organization/delete-actions";

export function DeleteOrgDialog() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getOrgDeletionPreview().then((p) => {
      if (!cancelled) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function reset() {
    setConfirmName("");
    setUnderstood(false);
  }

  function submit() {
    if (!preview) return;
    if (confirmName.trim().toLowerCase() !== preview.orgName.toLowerCase()) {
      toast.error(`Type "${preview.orgName}" to confirm.`);
      return;
    }
    if (!understood) {
      toast.error("Confirm you understand this is irreversible.");
      return;
    }
    startTransition(async () => {
      const res = await deleteOrganizationAction({ confirmName });
      if (res && !res.ok) toast.error(res.error ?? "Could not delete");
      // On success the server redirects, so we never reach this branch.
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle className="size-4" /> Delete organization
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-5" />
            Delete {preview?.orgName ?? "organization"}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                This will{" "}
                <strong className="text-foreground">permanently remove</strong>{" "}
                the workspace and all of its data. It cannot be undone.
              </p>
              {preview && (
                <div className="rounded-lg border bg-muted/40 p-3 text-foreground">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    What will be deleted
                  </p>
                  <ul className="grid grid-cols-2 gap-1 text-sm">
                    <li>
                      <span className="tabular-nums font-semibold">
                        {preview.jobsCount}
                      </span>{" "}
                      jobs
                    </li>
                    <li>
                      <span className="tabular-nums font-semibold">
                        {preview.candidatesCount}
                      </span>{" "}
                      candidates
                    </li>
                    <li>
                      <span className="tabular-nums font-semibold">
                        {preview.interviewsCount}
                      </span>{" "}
                      interviews
                    </li>
                    <li>
                      <span className="tabular-nums font-semibold">
                        {preview.notesCount}
                      </span>{" "}
                      notes
                    </li>
                    <li className="col-span-2">
                      <span className="tabular-nums font-semibold">
                        {preview.membersCount}
                      </span>{" "}
                      members will lose access
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {preview && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-name">
                Type the organization name to confirm
              </Label>
              <Input
                id="confirm-name"
                autoFocus
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={preview.orgName}
                disabled={pending}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                disabled={pending}
                className="mt-1"
              />
              <span>
                I understand this permanently deletes all jobs, candidates,
                interviews, notes and activity history for this workspace.
              </span>
            </label>
          </div>
        )}

        <AlertDialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={
              pending ||
              !preview ||
              !understood ||
              confirmName.trim().toLowerCase() !==
                (preview?.orgName.toLowerCase() ?? "__")
            }
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <AlertTriangle className="size-4" /> Delete forever
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
