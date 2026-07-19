"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseRow";
import { StartWorkoutButton } from "@/components/workout/StartWorkoutButton";
import {
  updateRoutine,
  updateRoutineExercise,
  removeRoutineExercise,
  moveRoutineExercise,
} from "@/server/actions/routines";
import { titleCase } from "@/lib/utils";
import type { RoutineDetail, RoutineExerciseDTO } from "@/server/routines";

export function RoutineEditor({ routine }: { routine: RoutineDetail }) {
  const router = useRouter();
  const [name, setName] = React.useState(routine.name);
  const [notes, setNotes] = React.useState(routine.notes ?? "");

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === routine.name) {
      setName(routine.name);
      return;
    }
    await updateRoutine(routine.id, { name: trimmed });
    router.refresh();
  }

  async function saveNotes() {
    if (notes === (routine.notes ?? "")) return;
    await updateRoutine(routine.id, { notes });
    router.refresh();
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="w-full bg-transparent text-2xl font-bold outline-none border-b border-transparent focus:border-line pb-1"
          placeholder="Routine name"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Add notes (optional)"
          rows={1}
          className="mt-2 w-full bg-transparent text-sm text-muted outline-none resize-none placeholder:text-subtle"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          {routine.exercises.length} Exercise{routine.exercises.length === 1 ? "" : "s"}
        </h2>
      </div>

      {routine.exercises.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description="Add exercises to build this routine."
          action={
            <Link href={`/routines/${routine.id}/add`}>
              <Button>
                <Plus size={16} /> Add exercise
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {routine.exercises.map((ex, i) => (
            <ExerciseEditCard
              key={ex.routineExerciseId}
              ex={ex}
              isFirst={i === 0}
              isLast={i === routine.exercises.length - 1}
            />
          ))}
          <Link href={`/routines/${routine.id}/add`} className="block">
            <Button variant="secondary" className="w-full">
              <Plus size={16} /> Add exercise
            </Button>
          </Link>
        </div>
      )}

      {routine.exercises.length > 0 && (
        <div className="sticky bottom-24 pt-2">
          <StartWorkoutButton routineId={routine.id} label="Start this routine" />
        </div>
      )}
    </div>
  );
}

function ExerciseEditCard({
  ex,
  isFirst,
  isLast,
}: {
  ex: RoutineExerciseDTO;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();

  async function move(direction: "up" | "down") {
    await moveRoutineExercise(ex.routineExerciseId, direction);
    router.refresh();
  }

  async function remove() {
    await removeRoutineExercise(ex.routineExerciseId);
    router.refresh();
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <ExerciseThumb image={ex.image} name={ex.name} size={44} />
        <Link href={`/exercises/${ex.exerciseId}`} className="min-w-0 flex-1">
          <div className="font-medium truncate">{titleCase(ex.name)}</div>
          <div className="text-xs text-muted truncate capitalize">{ex.target || ex.bodyPart}</div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => move("up")}
            disabled={isFirst}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-elevated disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => move("down")}
            disabled={isLast}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-elevated disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown size={16} />
          </button>
          <button
            onClick={remove}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
            aria-label="Remove"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <DefaultField
          label="Sets"
          value={ex.defaultSets}
          onCommit={(v) => updateRoutineExercise(ex.routineExerciseId, { defaultSets: v })}
        />
        <DefaultField
          label="Reps"
          value={ex.defaultReps}
          onCommit={(v) => updateRoutineExercise(ex.routineExerciseId, { defaultReps: v })}
        />
        <DefaultField
          label="Weight (kg)"
          value={ex.defaultWeight}
          step={2.5}
          onCommit={(v) => updateRoutineExercise(ex.routineExerciseId, { defaultWeight: v })}
        />
      </div>
    </Card>
  );
}

function DefaultField({
  label,
  value,
  step = 1,
  onCommit,
}: {
  label: string;
  value: number;
  step?: number;
  onCommit: (value: number) => Promise<unknown>;
}) {
  const router = useRouter();
  const [val, setVal] = React.useState(String(value));

  async function commit() {
    const num = Number(val);
    if (!Number.isFinite(num) || num === value) {
      setVal(String(value));
      return;
    }
    await onCommit(num);
    router.refresh();
  }

  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-subtle mb-1">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        className="h-9 w-full rounded-lg bg-elevated border border-line px-2 text-center text-sm tabular-nums outline-none focus:border-accent"
      />
    </label>
  );
}
