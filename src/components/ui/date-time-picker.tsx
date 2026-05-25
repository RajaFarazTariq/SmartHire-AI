"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// 15-minute time options across the day.
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const value = `${pad(h)}:${pad(m)}`;
  const label = new Date(2000, 0, 1, h, m).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return { value, label };
});

export function DateTimePicker({
  value,
  onChange,
}: {
  value: string; // "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
}) {
  const parsed = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(value);
  const initialDate = parsed
    ? new Date(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]))
    : null;
  const initialTime = parsed ? parsed[4] : "";

  const [date, setDate] = useState<Date | null>(initialDate);
  const [time, setTime] = useState<string>(initialTime);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(
    initialDate ?? new Date(),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function push(nextDate: Date | null, nextTime: string) {
    if (!nextDate) return;
    onChange(`${toDateStr(nextDate)}T${nextTime || "09:00"}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grid = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [viewMonth]);

  function selectDay(day: Date) {
    const nextTime = time || "09:00";
    setDate(day);
    setTime(nextTime);
    setOpen(false);
    push(day, nextTime);
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4 shrink-0 opacity-60" />
          {date
            ? date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Pick a date"}
        </button>

        {open && (
          <div className="absolute left-0 z-50 mt-1 w-72 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
                  )
                }
                className="rounded-md p-1 hover:bg-accent"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium">
                {viewMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
                  )
                }
                className="rounded-md p-1 hover:bg-accent"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  className="py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {d}
                </span>
              ))}
              {grid.map((day, i) => {
                if (!day) return <span key={i} />;
                const disabled = day < today;
                const selected = date && toDateStr(day) === toDateStr(date);
                const isToday = toDateStr(day) === toDateStr(today);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md text-sm transition-colors",
                      disabled && "cursor-not-allowed opacity-30",
                      !disabled && !selected && "hover:bg-accent",
                      selected && "bg-primary text-primary-foreground",
                      !selected && isToday && "border border-primary/40",
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Select
        value={time}
        onValueChange={(t) => {
          setTime(t);
          push(date, t);
        }}
      >
        <SelectTrigger>
          <div className="flex items-center gap-2 overflow-hidden">
            <Clock className="size-4 shrink-0 opacity-60" />
            <SelectValue placeholder="Pick a time" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
