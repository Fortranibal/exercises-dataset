import { notFound, redirect } from "next/navigation";
import { getWorkout } from "@/server/workouts";
import { getFilterFacets } from "@/server/exercises";
import { WorkoutLogger } from "@/components/workout/WorkoutLogger";

export const dynamic = "force-dynamic";

export default async function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [workout, facets] = await Promise.all([getWorkout(id), getFilterFacets()]);
  if (!workout) notFound();
  if (workout.completedAt) redirect(`/history/${id}`);

  return <WorkoutLogger workout={workout} facets={facets} />;
}
