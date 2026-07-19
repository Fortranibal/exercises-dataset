"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Target } from "lucide-react";
import { Button, Card, Chip, Input, Label, EmptyState } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { ProgressRing } from "@/components/goals/ProgressRing";
import { createGoal, deleteGoal } from "@/server/actions/goals";
import { fmtCompact, fmtNumber, pct } from "@/lib/utils";
import { MUSCLE_GROUPS } from "@/lib/muscles";
import type { GoalType, GoalWithProgress } from "@/server/goals";

const TYPES: Array<{ key: GoalType; label: string }> = [
  { key: "workouts_per_week", label: "Workouts / week" },
  { key: "volume_per_week", label: "Volume / week" },
  { key: "sets_per_week", label: "Sets / week" },
];

function fmtGoalValue(value: number, unit: string): string {
  return unit === "kg" ? `${fmtCompact(value)} kg` : fmtNumber(value);
}

export function GoalsClient({ goals }: { goals: GoalWithProgress[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [type, setType] = React.useState<GoalType>("workouts_per_week");
  const [target, setTarget] = React.useState("");
  const [muscleGroup, setMuscleGroup] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setError(null);
    const t = Number(target);
    if (!Number.isFinite(t) || t <= 0) {
      setError("Enter a target greater than zero");
      return;
    }
    setBusy(true);
    const res = await createGoal({
      type,
      target: t,
      muscleGroup: type === "sets_per_week" && muscleGroup ? muscleGroup : null,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTarget("");
    setMuscleGroup("");
    setAddOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this goal?")) return;
    await deleteGoal(id);
    router.refresh();
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <Button className="w-full" onClick={() => setAddOpen(true)}>
        <Plus size={16} /> Add goal
      </Button>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={24} />}
          title="No goals yet"
          description="Set weekly targets for workouts, training volume, or sets per muscle group."
        />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <Card key={g.id} className="p-4 flex items-center gap-4">
              <ProgressRing value={g.current} target={g.target} size={72} stroke={7}>
                <span className="text-sm font-bold tabular-nums">{pct(g.current, g.target)}%</span>
              </ProgressRing>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{g.label}</div>
                <div className="text-sm text-muted tabular-nums">
                  {fmtGoalValue(g.current, g.unit)} / {fmtGoalValue(g.target, g.unit)}
                </div>
                <div className="text-xs text-subtle">this week</div>
              </div>
              <button
                onClick={() => remove(g.id)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft shrink-0"
                aria-label="Delete goal"
              >
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add goal"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Add goal"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Goal type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Chip key={t.key} active={type === t.key} onClick={() => setType(t.key)}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="goal-target-val">
              Weekly target {type === "volume_per_week" ? "(kg)" : ""}
            </Label>
            <Input
              id="goal-target-val"
              type="number"
              inputMode="numeric"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={type === "workouts_per_week" ? "e.g. 4" : type === "volume_per_week" ? "e.g. 20000" : "e.g. 15"}
            />
          </div>

          {type === "sets_per_week" && (
            <div>
              <Label>Muscle group (optional)</Label>
              <div className="flex flex-wrap gap-2">
                <Chip active={muscleGroup === ""} onClick={() => setMuscleGroup("")}>
                  All
                </Chip>
                {MUSCLE_GROUPS.map((m) => (
                  <Chip key={m} active={muscleGroup === m} onClick={() => setMuscleGroup(m)}>
                    {m}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Sheet>
    </div>
  );
}
