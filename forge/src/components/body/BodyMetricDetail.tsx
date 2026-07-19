"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Target, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { LogMeasurementSheet } from "@/components/body/LogMeasurementSheet";
import { MetricChart } from "@/components/body/MetricChart";
import { MetricGoalSheet } from "@/components/body/MetricGoalSheet";
import { clearMetricPoint } from "@/server/actions/body";
import { fmtWeight } from "@/lib/utils";
import type { BodyMetricKey } from "@/lib/body-metrics";
import type { MetricDetail } from "@/server/body";

export function BodyMetricDetail({ detail }: { detail: MetricDetail }) {
  const router = useRouter();
  const [logOpen, setLogOpen] = React.useState(false);
  const [goalOpen, setGoalOpen] = React.useState(false);

  const reversed = [...detail.series].reverse();

  async function removePoint(entryId: string) {
    if (!confirm("Remove this data point?")) return;
    await clearMetricPoint(entryId, detail.key);
    router.refresh();
  }

  const goalIcon =
    detail.goal?.direction === "increase" ? (
      <TrendingUp size={14} />
    ) : detail.goal?.direction === "decrease" ? (
      <TrendingDown size={14} />
    ) : (
      <Minus size={14} />
    );

  return (
    <div className="px-4 py-4 space-y-5">
      <Card className="p-4">
        <MetricChart series={detail.series} unit={detail.unit} goal={detail.goal} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setLogOpen(true)}>
          <Plus size={16} /> Add value
        </Button>
        <Button variant="secondary" onClick={() => setGoalOpen(true)}>
          <Target size={16} /> {detail.goal ? "Edit goal" : "Set goal"}
        </Button>
      </div>

      {detail.goal && (
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
            {goalIcon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium capitalize">{detail.goal.direction}</div>
            <div className="text-xs text-muted">
              {detail.goal.target != null
                ? `Target ${fmtWeight(detail.goal.target)} ${detail.unit}`
                : "No specific target"}
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          History
        </h2>
        {reversed.length === 0 ? (
          <Card className="p-4 text-sm text-muted">No entries yet.</Card>
        ) : (
          <div className="space-y-2">
            {reversed.map((p) => (
              <Card key={p.entryId} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-medium tabular-nums">
                    {fmtWeight(p.value)} <span className="text-muted text-sm">{detail.unit}</span>
                  </div>
                  <div className="text-xs text-subtle">
                    {format(new Date(p.date), "EEE, MMM d, yyyy")}
                  </div>
                </div>
                <button
                  onClick={() => removePoint(p.entryId)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
                  aria-label="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LogMeasurementSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        focusMetric={detail.key as BodyMetricKey}
        placeholders={{ [detail.key]: detail.series.at(-1)?.value ?? null }}
      />
      <MetricGoalSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        metricKey={detail.key}
        unit={detail.unit}
        current={detail.goal}
      />
    </div>
  );
}
