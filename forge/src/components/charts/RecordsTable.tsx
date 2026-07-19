"use client";

import * as React from "react";
import { fmtWeight } from "@/lib/utils";
import type { RepMaxRow } from "@/server/progress";

export function RecordsTable({ rows }: { rows: RepMaxRow[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? rows : rows.slice(0, 12);

  return (
    <div>
      <div className="grid grid-cols-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-subtle border-b border-line">
        <div>Rep max</div>
        <div className="text-right">Estimated</div>
        <div className="text-right">Best actual</div>
      </div>
      <div className="divide-y divide-line">
        {visible.map((r) => (
          <div key={r.reps} className="grid grid-cols-3 px-3 py-2.5 text-sm items-center">
            <div className="font-medium">
              {r.reps}
              <span className="text-subtle font-normal">RM</span>
            </div>
            <div className="text-right tabular-nums">
              {r.estimated > 0 ? `${fmtWeight(r.estimated)} kg` : "—"}
            </div>
            <div className="text-right tabular-nums">
              {r.actual != null ? (
                <span className="text-accent font-medium">{fmtWeight(r.actual)} kg</span>
              ) : (
                <span className="text-subtle">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {rows.length > 12 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-2.5 text-xs font-medium text-accent hover:bg-elevated transition-colors"
        >
          {expanded ? "Show less" : `Show all ${rows.length} rep maxes`}
        </button>
      )}
    </div>
  );
}
