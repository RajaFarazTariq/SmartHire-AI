"use client";

import { useRouter } from "next/navigation";

import { ACTIVITY_TYPES } from "@/lib/activity-meta";
import {
  FilterBar,
  type FilterField,
  type FilterRule,
} from "@/components/ui/filter-bar";

// Activity is server-paginated, so filtering happens in the query (see
// getOrgActivity). The FilterBar only collects rules; on apply we push them
// into the URL (?f=…) and the server re-queries. accessors are unused here.
const FIELDS: FilterField<unknown>[] = [
  {
    key: "type",
    label: "Type",
    control: {
      kind: "select",
      options: ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    accessor: () => "",
  },
  { key: "user", label: "User", control: { kind: "text" }, accessor: () => "" },
  { key: "date", label: "Date", control: { kind: "date" }, accessor: () => "" },
];

export function ActivityFilters({ rules }: { rules: FilterRule[] }) {
  const router = useRouter();

  function onChange(next: FilterRule[]) {
    const active = next.filter((r) => r.value !== "");
    const params = new URLSearchParams();
    if (active.length) params.set("f", JSON.stringify(active));
    const qs = params.toString();
    router.push(qs ? `/activity?${qs}` : "/activity");
  }

  return <FilterBar fields={FIELDS} rules={rules} onChange={onChange} />;
}
