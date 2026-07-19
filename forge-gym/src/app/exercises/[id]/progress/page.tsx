import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { LineChart, Trophy } from "lucide-react";
import { getExercise } from "@/server/exercises";
import { getExerciseProgress } from "@/server/progress";
import { PageHeader } from "@/components/PageHeader";
import { Card, Stat, EmptyState, Button } from "@/components/ui";
import { ProgressChart } from "@/components/charts/ProgressChart";
import { titleCase, fmtWeight, fmtVolume, fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exercise, progress] = await Promise.all([getExercise(id), getExerciseProgress(id)]);
  if (!exercise) notFound();

  const { sessions, prs } = progress;
  const recent = [...sessions].reverse();

  return (
    <>
      <PageHeader title={titleCase(exercise.name)} subtitle="Progress" back={`/exercises/${id}`} />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<LineChart size={24} />}
          title="No data yet"
          description="Log this exercise in a workout to see your progress over time."
          action={
            <Link href="/workout">
              <Button>Start a workout</Button>
            </Link>
          }
        />
      ) : (
        <div className="px-4 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Best weight" value={`${fmtWeight(prs.bestWeight)} kg`} />
            <Stat label="Est. 1RM" value={`${fmtWeight(prs.best1RM)} kg`} />
            <Stat label="Best volume" value={fmtVolume(prs.bestVolume)} />
            <Stat label="Best reps" value={fmtNumber(prs.bestReps)} />
          </div>

          <Card className="p-4">
            <ProgressChart sessions={sessions} />
          </Card>

          <Link href={`/exercises/${id}/records`} className="block">
            <Card className="p-4 flex items-center gap-3 hover:bg-elevated transition-colors">
              <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
                <Trophy size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Rep max records</div>
                <div className="text-xs text-muted">Estimated 1RM through 12RM</div>
              </div>
            </Card>
          </Link>

          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              {sessions.length} session{sessions.length === 1 ? "" : "s"}
            </h2>
            <div className="space-y-2">
              {recent.map((s, i) => (
                <Card key={i} className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {format(new Date(s.date), "EEE, MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-muted">
                        Top set {fmtWeight(s.bestWeight)} kg × {s.topSetReps} · Est. 1RM{" "}
                        {fmtWeight(s.est1RM)} kg
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{fmtVolume(s.volume)}</div>
                      <div className="text-xs text-subtle">{s.totalReps} reps</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
