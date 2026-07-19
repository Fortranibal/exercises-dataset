import { getFilterFacets } from "@/server/exercises";
import { ExerciseBrowser } from "@/components/exercises/ExerciseBrowser";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const facets = await getFilterFacets();
  return (
    <>
      <PageHeader title="Exercises" subtitle="Browse the library or add your own" />
      <ExerciseBrowser facets={facets} />
    </>
  );
}
