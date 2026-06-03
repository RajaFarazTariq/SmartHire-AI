"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { validateName } from "@/lib/validators/name";
import { saveNameAction } from "./actions";

export function NameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateName(name);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    setPending(true);
    const res = await saveNameAction(check.value);
    if (res.ok) {
      router.push("/continue");
    } else {
      setPending(false);
      setError(res.error ?? "Couldn't save your name.");
      toast.error(res.error ?? "Couldn't save your name.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onBlur={() => {
            if (!name.trim()) return;
            const c = validateName(name);
            setError(c.ok ? null : c.error);
          }}
          aria-invalid={error ? true : undefined}
          className={cn(error && "border-rose-500 focus-visible:ring-rose-500")}
          placeholder="e.g. Alex Johnson"
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            Continue <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
