"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Mail, MapPin, X, FileText } from "lucide-react";

import { timeAgo } from "@/lib/activity-meta";
import type { MemberRow } from "./actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function displayName(m: MemberRow) {
  return m.fullName ?? m.username ?? m.email.split("@")[0];
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const SKILLS_SHOWN = 4;

export function MembersList({ members }: { members: MemberRow[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      return (
        displayName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.headline?.toLowerCase().includes(q) ?? false) ||
        (m.location?.toLowerCase().includes(q) ?? false) ||
        m.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [members, query]);

  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserPlus className="size-6" />
          </span>
          <div>
            <p className="font-medium">No members yet</p>
            <p className="text-sm text-muted-foreground">
              People who sign up through the candidate portal appear here until
              they apply to their first job — then they move to Candidates.
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
            placeholder="Search by name, email, headline, location, or skill…"
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Member</th>
                <th className="hidden px-3 py-2.5 lg:table-cell">Skills</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Resume</th>
                <th className="px-3 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    No members match your search.
                  </td>
                </tr>
              ) : (
                visible.map((m) => {
                  const name = displayName(m);
                  const extra = Math.max(0, m.skills.length - SKILLS_SHOWN);
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-accent/30">
                      {/* Identity */}
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initials(name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {name}
                            </span>
                            {m.headline && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {m.headline}
                              </span>
                            )}
                            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Mail className="size-3" />
                              <span className="truncate">{m.email}</span>
                            </span>
                            {m.location && (
                              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="size-3" />
                                <span className="truncate">{m.location}</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Skills */}
                      <td className="hidden px-3 py-2.5 align-top lg:table-cell">
                        {m.skills.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {m.skills.slice(0, SKILLS_SHOWN).map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="font-normal"
                              >
                                {s}
                              </Badge>
                            ))}
                            {extra > 0 && (
                              <Badge variant="outline" className="font-normal">
                                +{extra}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Resume */}
                      <td className="hidden px-3 py-2.5 align-top sm:table-cell">
                        {m.hasResume ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="size-3.5" /> On file
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-3 py-2.5 align-top">
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(m.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
