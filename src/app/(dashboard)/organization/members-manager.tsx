"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrganizationProfile } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Users,
  Settings,
  Search,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  UserCog,
  UserMinus,
  Mail,
  Clock,
  ArrowUpDown,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { roleLabel, roleRank, ROLE_ADMIN, ROLE_MANAGER } from "@/lib/rbac";
import { timeAgo } from "@/lib/activity-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  updateMemberRoleAction,
  removeMemberAction,
  inviteMemberAction,
  revokeInvitationAction,
  type OrgMemberRow,
  type PendingInvitation,
} from "./member-actions";
import { DeleteOrgDialog } from "@/components/organization/delete-org-dialog";

type Tab = "members" | "settings";
type SortKey = "name-asc" | "name-desc" | "role" | "newest" | "oldest";
type RoleFilter = "all" | "org:admin" | "org:manager" | "org:recruiter" | "org:member";
const PAGE_SIZE = 8;

const ROLE_STYLES: Record<string, string> = {
  "org:admin": "bg-primary/10 text-primary",
  "org:manager": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "org:recruiter": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "org:member": "bg-muted text-muted-foreground",
};

// Admin is reserved for the original founder and cannot be assigned via this UI.
// Per-caller filtering happens at render time so Managers don't see Manager.
const ASSIGNABLE_ROLES = [
  { value: "org:manager", label: "Manager" },
  { value: "org:recruiter", label: "Recruiter" },
  { value: "org:member", label: "Member" },
];

function assignableRolesFor(callerRole: string) {
  return ASSIGNABLE_ROLES.filter((r) => roleRank(callerRole) <= roleRank(r.value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MembersManager({
  members,
  invitations,
  currentUserId,
  currentUserRole,
  isAdmin,
  isOriginalAdmin,
}: {
  members: OrgMemberRow[];
  invitations: PendingInvitation[];
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
  isOriginalAdmin: boolean;
}) {
  const [tab, setTab] = useState<Tab>("members");
  // Non-admins never get the Settings tab (which would expose Clerk's admin UI).
  const activeTab: Tab = isAdmin ? tab : "members";

  return (
    <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
      {/* Sidebar nav */}
      <aside className="space-y-1 lg:sticky lg:top-20 lg:self-start">
        <SidebarTab
          active={activeTab === "members"}
          onClick={() => setTab("members")}
          icon={Users}
          label="Members"
          count={members.length + invitations.length}
        />
        {isAdmin && (
          <SidebarTab
            active={activeTab === "settings"}
            onClick={() => setTab("settings")}
            icon={Settings}
            label="Settings"
          />
        )}
      </aside>

      {/* Content */}
      <div>
        {activeTab === "members" ? (
          <MembersTab
            members={members}
            invitations={invitations}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isAdmin={isAdmin}
          />
        ) : (
          <SettingsTab isOriginalAdmin={isOriginalAdmin} />
        )}
      </div>
    </div>
  );
}

function SidebarTab({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
        active
          ? "border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm shadow-primary/20"
          : "border-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105",
          active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{label}</span>
      {count != null && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
            active
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function MembersTab({
  members,
  invitations,
  currentUserId,
  currentUserRole,
  isAdmin,
}: {
  members: OrgMemberRow[];
  invitations: PendingInvitation[];
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (!term) return true;
      return (
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
      );
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "role":
          return a.role.localeCompare(b.role);
        case "newest":
          return b.joinedAt.getTime() - a.joinedAt.getTime();
        case "oldest":
          return a.joinedAt.getTime() - b.joinedAt.getTime();
      }
    });
    return list;
  }, [members, query, roleFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const slice = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name or email…"
            className="h-9 pl-9"
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

        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v as RoleFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="org:admin">Admins</SelectItem>
            <SelectItem value="org:manager">Managers</SelectItem>
            <SelectItem value="org:recruiter">Recruiters</SelectItem>
            <SelectItem value="org:member">Members</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-9 w-full sm:w-44">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5 opacity-60" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="role">Role</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && <InviteSheet currentUserRole={currentUserRole} />}
      </div>

      {/* Member list */}
      <div className="divide-y">
        {slice.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Users className="size-6" />
            <p className="text-sm">
              {query || roleFilter !== "all"
                ? "No members match your filters."
                : "No members yet."}
            </p>
          </div>
        ) : (
          slice.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isAdmin={isAdmin}
              onChanged={() => router.refresh()}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Showing {pageSafe * PAGE_SIZE + 1}–
            {Math.min((pageSafe + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageSafe === 0}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="px-2 text-xs tabular-nums text-muted-foreground">
              {pageSafe + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageSafe >= totalPages - 1}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="border-t bg-muted/20">
          <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium">
            <Clock className="size-4 text-amber-500" />
            Pending invitations
            <Badge className="border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {invitations.length}
            </Badge>
          </div>
          <div className="divide-y">
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                isAdmin={isAdmin}
                onChanged={() => router.refresh()}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function MemberRow({
  member,
  currentUserId,
  currentUserRole,
  isAdmin,
  onChanged,
}: {
  member: OrgMemberRow;
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isMe = member.userId === currentUserId;
  const isAdminRole = member.role === ROLE_ADMIN;
  const isFounder = member.isOriginalAdmin;
  // The action menu is hidden for self, for the founder (untouchable), and
  // when the caller is below the target's rank (Manager looking at Manager).
  const canManageTarget =
    isAdmin &&
    !isMe &&
    !isFounder &&
    roleRank(currentUserRole) <= roleRank(member.role);
  const assignable = assignableRolesFor(currentUserRole).filter(
    (r) => r.value !== member.role,
  );

  function changeRole(newRole: string) {
    startTransition(async () => {
      const res = await updateMemberRoleAction(member.userId, newRole);
      if (res.ok) {
        toast.success("Role updated");
        onChanged();
      } else toast.error(res.error ?? "Failed");
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeMemberAction(member.userId);
      if (res.ok) {
        toast.success("Member removed");
        onChanged();
      } else toast.error(res.error ?? "Failed");
      setConfirmRemove(false);
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30">
        {/* Avatar */}
        <span className="relative shrink-0">
          {member.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.imageUrl}
              alt=""
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(member.name)}
            </span>
          )}
          {/* Active status dot */}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
        </span>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {member.name}
            {isMe && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                You
              </span>
            )}
            {isAdminRole && <Crown className="size-3.5 text-amber-500" />}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Mail className="size-3" /> {member.email}
          </p>
        </div>

        {/* Role badge */}
        <Badge
          className={cn(
            "hidden shrink-0 border-0 sm:inline-flex",
            ROLE_STYLES[member.role] ?? "bg-muted text-muted-foreground",
          )}
        >
          {roleLabel(member.role)}
        </Badge>

        {/* Joined */}
        <span className="hidden shrink-0 text-xs text-muted-foreground md:block">
          Joined {timeAgo(member.joinedAt)}
        </span>

        {/* Action menu — hidden against self, founder, and members above caller's rank */}
        {canManageTarget && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={pending}
                aria-label="Member actions"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="size-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {assignable.map((r) => (
                <DropdownMenuItem
                  key={r.value}
                  onClick={() => changeRole(r.value)}
                >
                  {r.value === ROLE_MANAGER ? (
                    <ShieldCheck className="size-4" />
                  ) : (
                    <UserCog className="size-4" />
                  )}
                  Change to {r.label}
                </DropdownMenuItem>
              ))}
              {assignable.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => setConfirmRemove(true)}
                className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
              >
                <UserMinus className="size-4" /> Remove from organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll lose access to this organization immediately. You can
              re-invite them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              disabled={pending}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InvitationRow({
  invitation,
  isAdmin,
  onChanged,
}: {
  invitation: PendingInvitation;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function revoke() {
    startTransition(async () => {
      const res = await revokeInvitationAction(invitation.id);
      if (res.ok) {
        toast.success("Invitation revoked");
        onChanged();
      } else toast.error(res.error ?? "Failed");
    });
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="relative">
        <span className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Mail className="size-4" />
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-amber-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{invitation.email}</p>
        <p className="text-xs text-muted-foreground">
          Invited {timeAgo(invitation.createdAt)}
        </p>
      </div>
      <Badge
        className={cn(
          "hidden shrink-0 border-0 sm:inline-flex",
          ROLE_STYLES[invitation.role] ?? "bg-muted text-muted-foreground",
        )}
      >
        {roleLabel(invitation.role)}
      </Badge>
      <Badge className="shrink-0 border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
        Pending
      </Badge>
      {isAdmin && (
        <Button
          variant="ghost"
          size="sm"
          onClick={revoke}
          disabled={pending}
          className="h-7 text-xs text-muted-foreground hover:text-rose-500"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Revoke"}
        </Button>
      )}
    </div>
  );
}

function InviteSheet({ currentUserRole }: { currentUserRole: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const inviteRoles = assignableRolesFor(currentUserRole);
  const [role, setRole] = useState(inviteRoles[1]?.value ?? "org:recruiter");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await inviteMemberAction({ email, role });
      if (res.ok) {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed to invite");
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-9">
          <UserPlus className="size-4" /> Invite member
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite a teammate</SheetTitle>
          <p className="text-sm text-muted-foreground">
            We'll send them an email invitation to join this organization.
          </p>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inviteRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={submit}
            disabled={pending || !email.trim()}
            className="w-full"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending…
              </>
            ) : (
              "Send invitation"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettingsTab({ isOriginalAdmin }: { isOriginalAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <CardContent className="p-6">
          <OrganizationProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full max-w-none shadow-none border-0",
                // The Clerk-hosted danger zone is the only path that lets
                // non-founder admins (e.g. Managers) hit a destructive
                // delete. Hide it — we own the delete UX below.
                membersPageDangerSection: "hidden",
                organizationProfileSection__danger: "hidden",
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Danger zone — original founder only (Rule 12). */}
      {isOriginalAdmin && (
        <Card className="gap-0 border-rose-200/60 bg-rose-50/40 py-0 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Danger zone</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this organization and all of its data.
                This cannot be undone.
              </p>
            </div>
            <DeleteOrgDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
