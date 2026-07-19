import { notFound } from "next/navigation";
import { getRoutine } from "@/server/routines";
import { getFilterFacets } from "@/server/exercises";
import { PageHeader } from "@/components/PageHeader";
import { AddExercisesClient } from "@/components/routines/AddExercisesClient";

export const dynamic = "force-dynamic";

export default async function AddRoutineExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [routine, facets] = await Promise.all([getRoutine(id), getFilterFacets()]);
  if (!routine) notFound();

  return (
    <>
      <PageHeader title="Add exercises" back={`/routines/${id}`} />
      <AddExercisesClient
        routineId={id}
        facets={facets}
        existingIds={routine.exercises.map((e) => e.exerciseId)}
      />
    </>
  );
}
