"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Search,
  X,
  Mail,
  Briefcase,
  Crown,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { updateMemberRoleAction } from "@/app/(dashboard)/organization/member-actions";
import type { MemberRow } from "./actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Roles an admin can assign from the members table (Admin is never grantable —
// it's reserved for the founder). The server action enforces the full hierarchy.
const ASSIGNABLE_ROLES = [
  { key: "org:manager", label: "Manager" },
  { key: "org:recruiter", label: "Recruiter" },
  { key: "org:member", label: "Member" },
];

// Role badge colours, keyed by the role label.
const ROLE_STYLES: Record<string, string> = {
  Admin: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  Manager: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  Recruiter: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  Member: "bg-muted text-muted-foreground",
  Hired: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
};

// Order the filter pills sensibly (staff by rank, then Hired).
const ROLE_ORDER = ["Admin", "Manager", "Recruiter", "Member", "Hired"];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

// "Since" = join/hire date. Within the last 24h show relative time
// ("3 hours ago"); after that show the actual date (06/04/2026).
function sinceLabel(d: Date): string {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return new Date(d).toLocaleDateString();
}

export function MembersList({
  members,
  canManageRoles,
  currentUserId,
}: {
  members: MemberRow[];
  canManageRoles: boolean;
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { All: members.length };
    for (const m of members) counts[m.role] = (counts[m.role] ?? 0) + 1;
    return counts;
  }, [members]);

  const roles = useMemo(
    () => ROLE_ORDER.filter((r) => (roleCounts[r] ?? 0) > 0),
    [roleCounts],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "All" && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.email?.toLowerCase().includes(q) ?? false) ||
        (m.jobTitle?.toLowerCase().includes(q) ?? false) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [members, query, roleFilter]);

  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </span>
          <div>
            <p className="font-medium">No members yet</p>
            <p className="text-sm text-muted-foreground">
              People in your organization and anyone you&apos;ve hired will
              appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, role, or job…"
            className="pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {visible.length} {visible.length === 1 ? "member" : "members"}
        </p>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-1.5">
        {["All", ...roles].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              roleFilter === r
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {r}
            <span className="ml-1.5 opacity-70">{roleCounts[r] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Roster table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Member</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Position</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    No members match your filters.
                  </td>
                </tr>
              ) : (
                visible.map((m) => (
                  <tr
                    key={`${m.kind}:${m.id}`}
                    className="transition-colors hover:bg-accent/30"
                  >
                    {/* Identity */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex items-start gap-3">
                        {m.imageUrl ? (
                          <Image
                            src={m.imageUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initials(m.name)}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-foreground">
                              {m.name}
                            </span>
                            {m.isOriginalAdmin && (
                              <Crown
                                className="size-3.5 shrink-0 text-amber-500"
                                aria-label="Organization founder"
                              />
                            )}
                          </span>
                          {m.email && (
                            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Mail className="size-3" />
                              <span className="truncate">{m.email}</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-2.5 align-top">
                      {canManageRoles &&
                      m.kind === "staff" &&
                      !m.isOriginalAdmin &&
                      m.id !== currentUserId ? (
                        <RoleMenu
                          userId={m.id}
                          currentRole={m.role}
                          currentRoleKey={m.roleKey}
                        />
                      ) : (
                        <Badge
                          className={cn(
                            "border-0",
                            ROLE_STYLES[m.role] ??
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {m.role}
                        </Badge>
                      )}
                    </td>

                    {/* Hired for */}
                    <td className="hidden px-3 py-2.5 align-top md:table-cell">
                      {m.jobTitle ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Briefcase className="size-3.5" /> {m.jobTitle}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Since */}
                    <td className="hidden px-3 py-2.5 align-top sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {m.since ? sinceLabel(m.since) : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Admin-only inline role switcher. Permission/hierarchy/founder rules are
// enforced server-side by updateMemberRoleAction; this just surfaces the options.
function RoleMenu({
  userId,
  currentRole,
  currentRoleKey,
}: {
  userId: string;
  currentRole: string;
  currentRoleKey: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(roleKey: string) {
    if (roleKey === currentRoleKey) return;
    startTransition(async () => {
      const res = await updateMemberRoleAction(userId, roleKey);
      if (res.ok) {
        toast.success("Role updated");
        router.refresh();
      } else {
        toast.error(res.error ?? "Couldn't update role");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md transition-opacity hover:opacity-80 disabled:opacity-60"
          aria-label="Change role"
        >
          <Badge
            className={cn(
              "border-0",
              ROLE_STYLES[currentRole] ?? "bg-muted text-muted-foreground",
            )}
          >
            {currentRole}
          </Badge>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Change role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ASSIGNABLE_ROLES.map((r) => (
          <DropdownMenuItem
            key={r.key}
            disabled={r.key === currentRoleKey}
            onSelect={() => change(r.key)}
          >
            {r.label}
            {r.key === currentRoleKey && (
              <span className="ml-auto text-xs text-muted-foreground">
                current
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
