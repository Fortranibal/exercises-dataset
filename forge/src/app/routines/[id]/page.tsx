import { notFound } from "next/navigation";
import { getRoutine } from "@/server/routines";
import { PageHeader } from "@/components/PageHeader";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { RoutineMenu } from "@/components/routines/RoutineMenu";

export const dynamic = "force-dynamic";

export default async function RoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const routine = await getRoutine(id);
  if (!routine) notFound();

  return (
    <>
      <PageHeader
        title="Edit routine"
        back="/routines"
        action={<RoutineMenu routineId={routine.id} />}
      />
      <RoutineEditor routine={routine} />
    </>
  );
}
