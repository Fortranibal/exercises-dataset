"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check, Trash2, MoreVertical, Dumbbell, X } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { ExerciseThumb } from "@/components/exercises/ExerciseRow";
import { ExerciseBrowser, type Facets } from "@/components/exercises/ExerciseBrowser";
import { titleCase, fmtWeight, fmtVolume, fmtDuration } from "@/lib/utils";
import {
  addWorkoutExercise,
  removeWorkoutExercise,
  addSet,
  updateSet,
  deleteSet,
  finishWorkout,
  cancelWorkout,
  updateWorkoutMeta,
} from "@/server/actions/workouts";
import type {
  WorkoutDetail,
  WorkoutExerciseDTO,
  WorkoutSetDTO,
  SetType,
  PreviousSet,
} from "@/server/workouts";
import type { ExerciseListItem } from "@/server/exercises";

const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: "",
  warmup: "W",
  drop: "D",
  failure: "F",
};
const SET_TYPE_COLOR: Record<SetType, string> = {
  normal: "text-muted",
  warmup: "text-warning",
  drop: "text-info",
  failure: "text-danger",
};

export function WorkoutLogger({
  workout,
  facets,
}: {
  workout: WorkoutDetail;
  facets: Facets;
}) {
  const router = useRouter();
  const [exercises, setExercises] = React.useState<WorkoutExerciseDTO[]>(workout.exercises);
  const [name, setName] = React.useState(workout.name);
  const [addOpen, setAddOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [typeTarget, setTypeTarget] = React.useState<{ weId: string; set: WorkoutSetDTO } | null>(
    null,
  );
  const [busy, setBusy] = React.useState(false);

  // Elapsed timer
  const [elapsed, setElapsed] = React.useState(() =>
    Math.max(0, Math.round((Date.now() - new Date(workout.startedAt).getTime()) / 1000)),
  );
  React.useEffect(() => {
    const start = new Date(workout.startedAt).getTime();
    const t = setInterval(() => {
      setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [workout.startedAt]);

  const totals = React.useMemo(() => {
    let sets = 0;
    let volume = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) {
        if (s.isCompleted) {
          sets += 1;
          volume += s.weight * s.reps;
        }
      }
    }
    return { sets, volume };
  }, [exercises]);

  /* -------------------------- local state mutators -------------------------- */

  function patchSet(weId: string, setId: string, patch: Partial<WorkoutSetDTO>) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.workoutExerciseId === weId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : ex,
      ),
    );
  }

  function commitSet(weId: string, setId: string, patch: Partial<WorkoutSetDTO>) {
    patchSet(weId, setId, patch);
    void updateSet(setId, patch);
  }

  async function onAddSet(weId: string) {
    const res = await addSet(weId);
    if (res.ok && res.data) {
      setExercises((prev) =>
        prev.map((ex) =>
          ex.workoutExerciseId === weId ? { ...ex, sets: [...ex.sets, res.data!.set] } : ex,
        ),
      );
    }
  }

  async function onDeleteSet(weId: string, setId: string) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.workoutExerciseId === weId
          ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
          : ex,
      ),
    );
    await deleteSet(setId);
  }

  async function onRemoveExercise(weId: string) {
    if (!confirm("Remove this exercise from the workout?")) return;
    setExercises((prev) => prev.filter((ex) => ex.workoutExerciseId !== weId));
    await removeWorkoutExercise(weId);
  }

  async function onAddExercise(item: ExerciseListItem) {
    const res = await addWorkoutExercise(workout.id, item.id);
    if (res.ok && res.data) {
      setExercises((prev) => [...prev, res.data!.exercise]);
    }
  }

  function applySetType(type: SetType) {
    if (!typeTarget) return;
    commitSet(typeTarget.weId, typeTarget.set.id, { setType: type });
    setTypeTarget(null);
  }

  async function onFinish() {
    const completed = exercises.some((ex) => ex.sets.some((s) => s.isCompleted));
    if (!completed) {
      if (!confirm("No sets are marked complete. Finish anyway?")) return;
    }
    setBusy(true);
    const res = await finishWorkout(workout.id);
    if (res.ok) {
      router.push(`/history/${workout.id}`);
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!confirm("Discard this workout? All logged sets will be lost.")) return;
    setBusy(true);
    setMenuOpen(false);
    const res = await cancelWorkout(workout.id);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  const existingIds = exercises.map((e) => e.exerciseId);

  return (
    <div className="pb-32">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-lg border-b border-line">
        <div className="flex items-center gap-2 px-4 h-14">
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim() && name !== workout.name) void updateWorkoutMeta(workout.id, { name });
              }}
              className="w-full bg-transparent font-bold text-base outline-none truncate"
            />
            <div className="text-xs text-muted tabular-nums">
              {fmtDuration(elapsed)} · {totals.sets} sets · {fmtVolume(totals.volume)}
            </div>
          </div>
          <Button variant="success" size="sm" onClick={onFinish} disabled={busy}>
            <Check size={16} /> Finish
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            aria-label="Options"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {exercises.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted">
            <Dumbbell size={28} className="mx-auto mb-2 text-subtle" />
            No exercises yet. Add your first exercise to start logging.
          </Card>
        )}

        {exercises.map((ex) => (
          <ExerciseLogCard
            key={ex.workoutExerciseId}
            ex={ex}
            onToggleComplete={(set) =>
              commitSet(ex.workoutExerciseId, set.id, { isCompleted: !set.isCompleted })
            }
            onChangeSet={(setId, patch) => commitSet(ex.workoutExerciseId, setId, patch)}
            onAddSet={() => onAddSet(ex.workoutExerciseId)}
            onRemove={() => onRemoveExercise(ex.workoutExerciseId)}
            onOpenType={(set) => setTypeTarget({ weId: ex.workoutExerciseId, set })}
          />
        ))}

        <Button variant="secondary" className="w-full" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add exercise
        </Button>
      </div>

      {/* Add exercise sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add exercise" size="lg">
        <div className="-mx-5 -my-4">
          <ExerciseBrowser
            facets={facets}
            mode="select"
            selectedIds={existingIds}
            onSelect={onAddExercise}
          />
        </div>
      </Sheet>

      {/* Workout menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Workout options" size="sm">
        <button
          onClick={onCancel}
          disabled={busy}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-danger-soft transition-colors text-left disabled:opacity-50"
        >
          <Trash2 size={18} className="text-danger" />
          <span className="text-sm font-medium text-danger">Discard workout</span>
        </button>
      </Sheet>

      {/* Set type sheet */}
      <Sheet
        open={typeTarget !== null}
        onClose={() => setTypeTarget(null)}
        title="Set type"
        size="sm"
      >
        <div className="space-y-2">
          {(["normal", "warmup", "drop", "failure"] as SetType[]).map((t) => (
            <button
              key={t}
              onClick={() => applySetType(t)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-elevated transition-colors text-left capitalize"
            >
              <span className={`w-6 text-center font-bold ${SET_TYPE_COLOR[t]}`}>
                {SET_TYPE_LABEL[t] || "•"}
              </span>
              <span className="text-sm font-medium">{t}</span>
            </button>
          ))}
          {typeTarget && (
            <button
              onClick={() => {
                onDeleteSet(typeTarget.weId, typeTarget.set.id);
                setTypeTarget(null);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-danger-soft transition-colors text-left"
            >
              <Trash2 size={18} className="text-danger" />
              <span className="text-sm font-medium text-danger">Delete set</span>
            </button>
          )}
        </div>
      </Sheet>
    </div>
  );
}

/* ------------------------------ Exercise card ----------------------------- */

function ExerciseLogCard({
  ex,
  onToggleComplete,
  onChangeSet,
  onAddSet,
  onRemove,
  onOpenType,
}: {
  ex: WorkoutExerciseDTO;
  onToggleComplete: (set: WorkoutSetDTO) => void;
  onChangeSet: (setId: string, patch: Partial<WorkoutSetDTO>) => void;
  onAddSet: () => void;
  onRemove: () => void;
  onOpenType: (set: WorkoutSetDTO) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-line">
        <ExerciseThumb image={ex.image} name={ex.name} size={40} />
        <Link href={`/exercises/${ex.exerciseId}`} className="min-w-0 flex-1">
          <div className="font-semibold truncate leading-tight">{titleCase(ex.name)}</div>
          <div className="text-xs text-muted truncate capitalize">{ex.target || ex.bodyPart}</div>
        </Link>
        <button
          onClick={onRemove}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft shrink-0"
          aria-label="Remove exercise"
        >
          <X size={18} />
        </button>
      </div>

      {/* Set table */}
      <div className="px-3 pt-2 pb-3">
        <div className="grid grid-cols-[2rem_1fr_4rem_4rem_2.5rem] gap-2 px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
          <div className="text-center">Set</div>
          <div>Previous</div>
          <div className="text-center">Kg</div>
          <div className="text-center">Reps</div>
          <div className="text-center">✓</div>
        </div>
        <div className="space-y-1">
          {ex.sets.map((set, i) => (
            <SetRow
              key={set.id}
              set={set}
              index={i}
              previous={ex.previous[i]}
              onToggleComplete={() => onToggleComplete(set)}
              onChange={(patch) => onChangeSet(set.id, patch)}
              onOpenType={() => onOpenType(set)}
            />
          ))}
        </div>
        <button
          onClick={onAddSet}
          className="mt-2 w-full h-9 rounded-lg bg-elevated text-sm font-medium text-muted hover:text-fg hover:bg-elevated2 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={15} /> Add set
        </button>
      </div>
    </Card>
  );
}

/* --------------------------------- Set row -------------------------------- */

function SetRow({
  set,
  index,
  previous,
  onToggleComplete,
  onChange,
  onOpenType,
}: {
  set: WorkoutSetDTO;
  index: number;
  previous: PreviousSet | undefined;
  onToggleComplete: () => void;
  onChange: (patch: Partial<WorkoutSetDTO>) => void;
  onOpenType: () => void;
}) {
  const [weight, setWeight] = React.useState(set.weight ? String(set.weight) : "");
  const [reps, setReps] = React.useState(set.reps ? String(set.reps) : "");

  function commitWeight() {
    const n = weight === "" ? 0 : Number(weight);
    if (Number.isFinite(n) && n !== set.weight) onChange({ weight: n });
  }
  function commitReps() {
    const n = reps === "" ? 0 : Number(reps);
    if (Number.isFinite(n) && n !== set.reps) onChange({ reps: n });
  }

  function toggle() {
    // Autofill from the placeholder/previous values when completing an empty set.
    if (!set.isCompleted) {
      if (weight === "" && previous) {
        setWeight(String(previous.weight));
        onChange({ weight: previous.weight });
      }
      if (reps === "" && previous) {
        setReps(String(previous.reps));
        onChange({ reps: previous.reps });
      }
    }
    onToggleComplete();
  }

  const typeLabel = SET_TYPE_LABEL[set.setType];

  return (
    <div
      className={`grid grid-cols-[2rem_1fr_4rem_4rem_2.5rem] gap-2 items-center rounded-lg py-1 ${
        set.isCompleted ? "bg-success-soft" : ""
      }`}
    >
      <button
        onClick={onOpenType}
        className={`h-8 rounded-md text-sm font-bold ${
          typeLabel ? SET_TYPE_COLOR[set.setType] : "text-muted"
        } hover:bg-elevated`}
      >
        {typeLabel || index + 1}
      </button>
      <div className="text-xs text-subtle truncate">
        {previous ? `${fmtWeight(previous.weight)}kg × ${previous.reps}` : "—"}
      </div>
      <input
        type="number"
        inputMode="decimal"
        step={2.5}
        min={0}
        value={weight}
        placeholder={previous ? fmtWeight(previous.weight) : "0"}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commitWeight}
        className="h-8 w-full rounded-md bg-elevated border border-line text-center text-sm tabular-nums outline-none focus:border-accent"
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={reps}
        placeholder={previous ? String(previous.reps) : "0"}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commitReps}
        className="h-8 w-full rounded-md bg-elevated border border-line text-center text-sm tabular-nums outline-none focus:border-accent"
      />
      <button
        onClick={toggle}
        className={`h-8 w-8 mx-auto rounded-md flex items-center justify-center transition-colors ${
          set.isCompleted
            ? "bg-success text-black"
            : "bg-elevated2 text-subtle hover:text-fg border border-line"
        }`}
        aria-label="Complete set"
      >
        <Check size={16} />
      </button>
    </div>
  );
}
