"use client";

import { useState } from "react";
import { Filter, Plus, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./dialog";

// ---------------------------------------------------------------------------
// Config-driven shared filter. Each page passes its own `fields`; the UI and
// behaviour are identical everywhere — only the field/operator/value options
// differ. Value matching + the modal/query-builder all live here.
// ---------------------------------------------------------------------------

/** A select option: a plain string (value === label) or a labelled pair. */
export type FilterSelectOption = string | { value: string; label: string };

const optValue = (o: FilterSelectOption) =>
  typeof o === "string" ? o : o.value;
const optLabel = (o: FilterSelectOption) =>
  typeof o === "string" ? o : o.label;

export type FilterControl =
  | { kind: "text" }
  | { kind: "number" }
  | { kind: "date" }
  | { kind: "select"; options: FilterSelectOption[] };

export type FilterField<T> = {
  key: string;
  label: string;
  control: FilterControl;
  /** Pull the comparable value for this field off an item. */
  accessor: (item: T) => string | number | string[] | Date | null | undefined;
};

export type FilterRule = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

const OPERATORS: Record<
  FilterControl["kind"],
  { value: string; label: string }[]
> = {
  text: [
    { value: "contains", label: "contains" },
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
  ],
  select: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
  ],
  number: [
    { value: "gte", label: "at least" },
    { value: "lte", label: "at most" },
    { value: "is", label: "is" },
  ],
  date: [
    { value: "on", label: "on" },
    { value: "before", label: "before" },
    { value: "after", label: "after" },
  ],
};

let counter = 0;
function newId() {
  counter += 1;
  return `flt-${counter}`;
}

function blankRule<T>(fields: FilterField<T>[]): FilterRule {
  const f = fields[0];
  return {
    id: newId(),
    field: f.key,
    operator: OPERATORS[f.control.kind][0].value,
    value: "",
  };
}

function ruleMatches<T>(
  item: T,
  rule: FilterRule,
  fields: FilterField<T>[],
): boolean {
  if (rule.value === "") return true; // a blank value adds no constraint
  const field = fields.find((f) => f.key === rule.field);
  if (!field) return true;

  const raw = rule.value;
  const val = field.accessor(item);
  const kind = field.control.kind;

  // Array values (e.g. skills): is = contains the value, is not = excludes it.
  if (Array.isArray(val)) {
    const has = val.some(
      (v) => String(v).toLowerCase() === raw.toLowerCase(),
    );
    return rule.operator === "is_not" ? !has : has;
  }

  if (kind === "number") {
    const n = Number(val);
    const r = Number(raw);
    if (Number.isNaN(n) || Number.isNaN(r)) return false;
    if (rule.operator === "gte") return n >= r;
    if (rule.operator === "lte") return n <= r;
    return n === r;
  }

  if (kind === "date") {
    if (val == null) return false;
    const d = new Date(val as string | number | Date);
    const r = new Date(raw);
    if (Number.isNaN(d.getTime()) || Number.isNaN(r.getTime())) return false;
    const day = (x: Date) => x.toISOString().slice(0, 10);
    if (rule.operator === "before") return d.getTime() < r.getTime();
    if (rule.operator === "after") return d.getTime() > r.getTime();
    return day(d) === day(r);
  }

  const s = String(val ?? "").toLowerCase();
  const r = raw.toLowerCase();
  if (rule.operator === "contains") return s.includes(r);
  if (rule.operator === "is_not") return s !== r;
  return s === r;
}

/** Filter `items` by all rules (AND). Blank-value rules are ignored. */
export function applyFilters<T>(
  items: T[],
  rules: FilterRule[],
  fields: FilterField<T>[],
): T[] {
  const active = rules.filter((r) => r.value !== "");
  if (active.length === 0) return items;
  return items.filter((it) => active.every((r) => ruleMatches(it, r, fields)));
}

/** Count of rules that actually constrain (used for the badge). */
export function activeFilterCount(rules: FilterRule[]): number {
  return rules.filter((r) => r.value !== "").length;
}

export function FilterBar<T>({
  fields,
  rules,
  onChange,
  className,
}: {
  fields: FilterField<T>[];
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterRule[]>(rules);
  const count = activeFilterCount(rules);

  function openModal() {
    // Restore the currently-applied filters (or seed one blank row).
    setDraft(rules.length ? rules.map((r) => ({ ...r })) : [blankRule(fields)]);
    setOpen(true);
  }

  function patchRow(id: string, patch: Partial<FilterRule>) {
    setDraft((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function changeField(id: string, key: string) {
    const f = fields.find((ff) => ff.key === key);
    if (!f) return;
    patchRow(id, {
      field: key,
      operator: OPERATORS[f.control.kind][0].value,
      value: "",
    });
  }

  function addRow() {
    setDraft((d) => [...d, blankRule(fields)]);
  }

  function removeRow(id: string) {
    // Never delete the last remaining row.
    setDraft((d) => (d.length <= 1 ? d : d.filter((r) => r.id !== id)));
  }

  function apply() {
    onChange(draft.filter((r) => r.value !== ""));
    setOpen(false);
  }

  const hasDraftValue = draft.some((r) => r.value !== "");

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={openModal}
        className={cn(
          "gap-2",
          count > 0 && "border-primary/50 text-foreground",
          className,
        )}
      >
        <Filter className="size-4" />
        Filter
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
      </Button>
      {count > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onChange([])}
          aria-label="Clear filters"
          title="Clear filters"
        >
          <X className="size-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add filters</DialogTitle>
            <DialogClose className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            {draft.map((row) => {
              const field =
                fields.find((f) => f.key === row.field) ?? fields[0];
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-2"
                >
                  {/* Field */}
                  <Select
                    value={row.field}
                    onValueChange={(v) => changeField(row.id, v)}
                  >
                    <SelectTrigger className="min-w-[120px] flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={row.operator}
                    onValueChange={(v) => patchRow(row.id, { operator: v })}
                  >
                    <SelectTrigger className="w-[104px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS[field.control.kind].map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value */}
                  <div className="min-w-[140px] flex-1">
                    <ValueControl
                      field={field}
                      value={row.value}
                      onChange={(v) => patchRow(row.id, { value: v })}
                    />
                  </div>

                  {/* Delete */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={draft.length <= 1}
                    onClick={() => removeRow(row.id)}
                    className="shrink-0 border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-500"
                    aria-label="Remove filter"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}

            <Button
              type="button"
              size="sm"
              onClick={addRow}
              className="gap-1.5"
            >
              <Plus className="size-4" /> Add filter
            </Button>
          </div>

          <DialogFooter>
            {hasDraftValue && (
              <Button
                variant="ghost"
                onClick={() => {
                  // Reset instantly: clear the applied filters on the list…
                  onChange([]);
                  // …and the modal's draft rows, so closing without Apply
                  // still leaves everything cleared.
                  setDraft([blankRule(fields)]);
                }}
                className="mr-auto text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-400"
              >
                Clear all
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={apply}>Apply filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValueControl<T>({
  field,
  value,
  onChange,
}: {
  field: FilterField<T>;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.control.kind === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {field.control.options.map((o) => (
            <SelectItem key={optValue(o)} value={optValue(o)}>
              {optLabel(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.control.kind === "number") {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value"
        className="h-9"
      />
    );
  }
  if (field.control.kind === "date") {
    return (
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value"
      className="h-9"
    />
  );
}
