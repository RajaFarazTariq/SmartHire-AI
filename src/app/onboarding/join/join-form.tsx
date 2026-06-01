"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Building2,
  Users,
  Loader2,
  Check,
  ChevronLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  searchOrganizations,
  requestToJoinAction,
  type OrgSearchResult,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function JoinOrgForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<OrgSearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  // Debounced search.
  useEffect(() => {
    if (picked) return; // hide search while composing request
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      searchOrganizations(term)
        .then((r) => setResults(r))
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query, picked]);

  function submit() {
    if (!picked) return;
    startTransition(async () => {
      const res = await requestToJoinAction({
        orgId: picked.id,
        orgName: picked.name,
        message,
      });
      if (res.ok) {
        toast.success(`Request sent to ${picked.name}`);
        router.push("/onboarding/pending");
      } else {
        toast.error(res.error ?? "Could not submit request");
      }
    });
  }

  if (picked) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          {picked.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picked.imageUrl}
              alt=""
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{picked.name}</p>
            <p className="text-xs text-muted-foreground">
              {picked.membersCount} member{picked.membersCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="msg">Message to admin (optional)</Label>
          <Textarea
            id="msg"
            rows={3}
            placeholder="e.g. I'm joining the recruiting team — please approve."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPicked(null)}
            disabled={pending}
          >
            <ChevronLeft className="size-4" /> Back
          </Button>
          <Button type="button" onClick={submit} disabled={pending} className="flex-1">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending request…
              </>
            ) : (
              "Send join request"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by organization name…"
          className="h-11 pl-9"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          {results.length === 0 && !searching ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No organizations match "{query.trim()}".
            </p>
          ) : (
            results.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setPicked(o)}
                className={cn(
                  "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent",
                )}
              >
                {o.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.imageUrl}
                    alt=""
                    className="size-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {o.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" /> {o.membersCount}
                  </span>
                </span>
                <Check className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      )}

      {query.trim().length < 2 && (
        <p className="text-center text-xs text-muted-foreground">
          Type at least 2 characters to search.
        </p>
      )}
    </div>
  );
}
