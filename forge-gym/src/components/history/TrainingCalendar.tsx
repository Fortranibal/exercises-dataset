"use client";

import * as React from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function TrainingCalendar({ dates }: { dates: string[] }) {
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()));

  const trained = React.useMemo(() => {
    const set = new Set<string>();
    for (const iso of dates) set.add(localKey(new Date(iso)));
    return set;
  }, [dates]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Monday-first leading blanks (getDay: 0=Sun..6=Sat)
  const leadingBlanks = (getDay(monthStart) + 6) % 7;
  const today = new Date();

  const trainedThisMonth = days.filter((d) => trained.has(localKey(d))).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-elevated"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</div>
        <button
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-elevated"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-medium text-subtle">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const isTrained = trained.has(localKey(d));
          const isToday = isSameDay(d, today);
          return (
            <div
              key={localKey(d)}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                isTrained
                  ? "bg-accent text-accent-fg"
                  : isToday
                    ? "border border-accent text-accent"
                    : "text-muted"
              }`}
            >
              {format(d, "d")}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted text-center">
        {trainedThisMonth} workout{trainedThisMonth === 1 ? "" : "s"} this month
      </div>
    </Card>
  );
}
