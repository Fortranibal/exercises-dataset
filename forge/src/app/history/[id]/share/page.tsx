import { notFound, redirect } from "next/navigation";
import { getWorkout } from "@/server/workouts";
import { workoutStats } from "@/lib/workout-stats";
import { PageHeader } from "@/components/PageHeader";
import { ShareCardClient, type ShareData } from "@/components/share/ShareCardClient";

export const dynamic = "force-dynamic";

export default async function ShareWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();
  if (!workout.completedAt) redirect(`/workout/${id}`);

  const stats = workoutStats(workout);

  const topExercises = workout.exercises
    .map((ex) => ({
      name: ex.name,
      sets: ex.sets.length,
      volume: ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3);

  const data: ShareData = {
    name: workout.name,
    dateISO: workout.completedAt,
    durationSec: workout.durationSec,
    volume: stats.volume,
    sets: stats.sets,
    reps: stats.reps,
    topExercises,
  };

  return (
    <>
      <PageHeader title="Share workout" back={`/history/${id}`} />
      <ShareCardClient data={data} />
    </>
  );
}
