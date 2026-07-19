"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Dumbbell, ChevronRight } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { startWorkout } from "@/server/actions/workouts";
import type { RoutineListItem } from "@/server/routines";

export function WorkoutStartOptions({ routines }: { routines: RoutineListItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function start(routineId?: string) {
    setBusy(routineId ?? "empty");
    const res = await startWorkout(routineId);
    if (res.ok && res.data) {
      router.push(`/workout/${res.data.id}`);
    } else {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        size="lg"
        className="w-full shadow-lg shadow-accent/20"
        onClick={() => start()}
        disabled={busy !== null}
      >
        <Plus size={18} /> {busy === "empty" ? "Starting…" : "Start empty workout"}
      </Button>

      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Start from routine
        </h2>
        {routines.length === 0 ? (
          <Card className="p-4 text-sm text-muted">
            No routines yet. Create one in the Routines tab.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {routines.map((r) => (
              <button
                key={r.id}
                onClick={() => start(r.id)}
                disabled={busy !== null}
                className="w-full text-left disabled:opacity-60"
              >
                <Card className="p-3.5 hover:bg-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: r.color ?? "var(--color-accent-soft)" }}
                    >
                      {r.emoji ?? <Dumbbell size={18} className="text-accent" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted truncate">
                        {r.exerciseCount} exercise{r.exerciseCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    {busy === r.id ? (
                      <Play size={18} className="text-accent shrink-0 animate-pulse" />
                    ) : (
                      <ChevronRight size={18} className="text-subtle shrink-0" />
                    )}
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
