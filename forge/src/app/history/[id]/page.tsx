import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Clock, Share2 } from "lucide-react";
import { getWorkout } from "@/server/workouts";
import { workoutStats } from "@/lib/workout-stats";
import { PageHeader } from "@/components/PageHeader";
import { Card, Stat, Badge, Button } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseRow";
import { DeleteWorkoutButton } from "@/components/history/DeleteWorkoutButton";
import { titleCase, fmtVolume, fmtNumber, fmtDuration, fmtWeight } from "@/lib/utils";
import type { SetType } from "@/server/workouts";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<SetType, string> = {
  normal: "",
  warmup: "Warmup",
  drop: "Drop",
  failure: "Failure",
};

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();
  if (!workout.completedAt) redirect(`/workout/${id}`);

  const stats = workoutStats(workout);

  return (
    <>
      <PageHeader
        title={workout.name}
        back="/history"
        action={<DeleteWorkoutButton id={workout.id} />}
      />

      <div className="px-4 py-4 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock size={14} />
          {format(new Date(workout.completedAt), "EEEE, MMMM d, yyyy · HH:mm")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Volume" value={fmtVolume(stats.volume)} />
          <Stat label="Duration" value={fmtDuration(workout.durationSec)} />
          <Stat label="Sets" value={fmtNumber(stats.sets)} />
          <Stat label="Reps" value={fmtNumber(stats.reps)} />
        </div>

        <Link href={`/history/${workout.id}/share`} className="block">
          <Button variant="secondary" className="w-full">
            <Share2 size={16} /> Share workout
          </Button>
        </Link>

        <div className="space-y-3">
          {workout.exercises.map((ex) => (
            <Card key={ex.workoutExerciseId} className="overflow-hidden">
              <div className="flex items-center gap-3 p-3 border-b border-line">
                <ExerciseThumb image={ex.image} name={ex.name} size={40} />
                <Link href={`/exercises/${ex.exerciseId}`} className="min-w-0 flex-1">
                  <div className="font-semibold truncate leading-tight">{titleCase(ex.name)}</div>
                  <div className="text-xs text-muted truncate capitalize">
                    {ex.sets.length} set{ex.sets.length === 1 ? "" : "s"} · {ex.target || ex.bodyPart}
                  </div>
                </Link>
              </div>
              <div className="divide-y divide-line">
                {ex.sets.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-5 text-subtle tabular-nums">{i + 1}</span>
                    <span className="flex-1 tabular-nums">
                      {fmtWeight(s.weight)} kg × {s.reps}
                    </span>
                    {s.setType !== "normal" && (
                      <Badge tone={s.setType === "failure" ? "danger" : "warning"}>
                        {TYPE_LABEL[s.setType]}
                      </Badge>
                    )}
                    <span className="text-xs text-subtle tabular-nums">
                      {fmtWeight(s.weight * s.reps)} kg
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
