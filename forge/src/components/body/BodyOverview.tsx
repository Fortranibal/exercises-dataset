"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ArrowUp, ArrowDown, Target } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { LogMeasurementSheet } from "@/components/body/LogMeasurementSheet";
import { fmtWeight } from "@/lib/utils";
import type { BodyMetricKey } from "@/lib/body-metrics";
import type { BodyMetricOverview } from "@/server/body";

export function BodyOverview({ overview }: { overview: BodyMetricOverview[] }) {
  const [logOpen, setLogOpen] = React.useState(false);

  const placeholders = React.useMemo(() => {
    const p: Partial<Record<BodyMetricKey, number | null>> = {};
    for (const m of overview) p[m.key] = m.latest;
    return p;
  }, [overview]);

  const hasAny = overview.some((m) => m.latest != null);

  return (
    <div className="px-4 py-4 space-y-4">
      <Button className="w-full" onClick={() => setLogOpen(true)}>
        <Plus size={16} /> Log measurement
      </Button>

      {!hasAny ? (
        <EmptyState
          icon={<Target size={24} />}
          title="No measurements yet"
          description="Track your body weight, body fat, and circumference measurements over time."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {overview.map((m) => {
            const change =
              m.latest != null && m.previous != null ? m.latest - m.previous : null;
            return (
              <Link key={m.key} href={`/body/${m.key}`}>
                <Card className="p-4 h-full hover:bg-elevated transition-colors">
                  <div className="text-xs text-subtle font-medium">{m.label}</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">
                    {m.latest != null ? fmtWeight(m.latest) : "—"}
                    {m.latest != null && <span className="text-sm text-muted ml-1">{m.unit}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {change != null && change !== 0 ? (
                      <span
                        className={`flex items-center gap-0.5 ${
                          change > 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {fmtWeight(Math.abs(change))}
                      </span>
                    ) : (
                      <span className="text-subtle">{m.count > 0 ? "No change" : "No data"}</span>
                    )}
                    {m.goal && (
                      <span className="flex items-center gap-0.5 text-accent">
                        <Target size={11} />
                        {m.goal.target != null ? fmtWeight(m.goal.target) : m.goal.direction}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <LogMeasurementSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        placeholders={placeholders}
      />
    </div>
  );
}
