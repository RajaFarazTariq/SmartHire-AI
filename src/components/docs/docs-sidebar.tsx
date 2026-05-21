"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type DocsTocItem = { id: string; title: string };

export function DocsSidebar({ items }: { items: DocsTocItem[] }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(items[0]?.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="sticky top-20">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs…"
          className="pl-9"
        />
      </div>
      <nav className="flex flex-col gap-0.5">
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">No matches</p>
        )}
        {filtered.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              activeId === item.id
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  );
}
