"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { CreateJobState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type JobFormDefaults = {
  title: string;
  company: string;
  description: string;
  requiredSkills: string;
  preferredSkills: string;
  minExperience: string;
};

const empty: JobFormDefaults = {
  title: "",
  company: "",
  description: "",
  requiredSkills: "",
  preferredSkills: "",
  minExperience: "",
};

const initialState: CreateJobState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function JobForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: CreateJobState, formData: FormData) => Promise<CreateJobState>;
  defaults?: Partial<JobFormDefaults>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const d = { ...empty, ...defaults };

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={d.title}
          placeholder="Senior Backend Engineer"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          name="company"
          defaultValue={d.company}
          placeholder="Acme Inc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={d.description}
          placeholder="What the role involves, responsibilities, team…"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requiredSkills">
          Required skills <span className="text-destructive">*</span>
        </Label>
        <Input
          id="requiredSkills"
          name="requiredSkills"
          defaultValue={d.requiredSkills}
          placeholder="Python, PostgreSQL, REST APIs"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated. Used for candidate matching.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredSkills">Preferred skills</Label>
        <Input
          id="preferredSkills"
          name="preferredSkills"
          defaultValue={d.preferredSkills}
          placeholder="Kubernetes, gRPC"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated (optional).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minExperience">Minimum experience (years)</Label>
        <Input
          id="minExperience"
          name="minExperience"
          type="number"
          min={0}
          max={50}
          defaultValue={d.minExperience}
          placeholder="3"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="ghost">
          <Link href="/jobs">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
