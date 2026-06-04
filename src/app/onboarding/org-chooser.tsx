"use client";

import { useState } from "react";
import { OrganizationList } from "@clerk/nextjs";
import { Plus, Search, ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";

import { JoinOrgForm } from "./join/join-form";

type Mode = "choose" | "create" | "join";

export function OrgChooser() {
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "create") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <BackButton onClick={() => setMode("choose")} />
        {/* OrganizationList covers both creating a new org and selecting an
            existing membership, so invited recruiters are never locked out. */}
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <BackButton onClick={() => setMode("choose")} />
        <JoinOrgForm />
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-md gap-4 sm:max-w-2xl sm:grid-cols-2">
      <ChooserCard
        icon={Plus}
        title="Create New Organization"
        description="Start a fresh workspace and invite your team."
        onClick={() => setMode("create")}
      />
      <ChooserCard
        icon={Search}
        title="Join Existing Organization"
        description="Find your team and request to join it."
        onClick={() => setMode("join")}
      />
    </div>
  );
}

function ChooserCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <Icon className="size-5" />
      </span>
      <span className="flex-1 space-y-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Continue
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Back to options
    </button>
  );
}
