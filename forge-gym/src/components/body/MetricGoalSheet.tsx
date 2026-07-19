"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { setMeasurementGoal } from "@/server/actions/body";
import { cn } from "@/lib/utils";
import type { GoalDirection, MetricGoal } from "@/lib/body-metrics";

const DIRECTIONS: Array<{ key: GoalDirection; label: string; icon: React.ReactNode }> = [
  { key: "increase", label: "Increase", icon: <TrendingUp size={16} /> },
  { key: "maintain", label: "Maintain", icon: <Minus size={16} /> },
  { key: "decrease", label: "Decrease", icon: <TrendingDown size={16} /> },
];

export function MetricGoalSheet({
  open,
  onClose,
  metricKey,
  unit,
  current,
}: {
  open: boolean;
  onClose: () => void;
  metricKey: string;
  unit: string;
  current: MetricGoal | null;
}) {
  const router = useRouter();
  const [target, setTarget] = React.useState(current?.target != null ? String(current.target) : "");
  const [direction, setDirection] = React.useState<GoalDirection>(current?.direction ?? "maintain");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    setBusy(true);
    const t = target === "" ? null : Number(target);
    await setMeasurementGoal(metricKey, t != null && Number.isFinite(t) ? t : null, direction);
    setBusy(false);
    router.refresh();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Set goal"
      size="sm"
      footer={
        <Button className="w-full" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save goal"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Direction</Label>
          <div className="grid grid-cols-3 gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDirection(d.key)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors",
                  direction === d.key
                    ? "bg-accent-soft border-accent text-accent"
                    : "border-line text-muted hover:text-fg",
                )}
              >
                {d.icon}
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="goal-target">
            Target value <span className="text-subtle">({unit}, optional)</span>
          </Label>
          <Input
            id="goal-target"
            type="number"
            inputMode="decimal"
            step={0.1}
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. 75"
          />
        </div>
      </div>
    </Sheet>
  );
}
