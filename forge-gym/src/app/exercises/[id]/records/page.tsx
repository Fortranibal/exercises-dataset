import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getExercise } from "@/server/exercises";
import { getExerciseRecords } from "@/server/progress";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState, Button } from "@/components/ui";
import { RecordsTable } from "@/components/charts/RecordsTable";
import { titleCase, fmtWeight } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExerciseRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exercise, records] = await Promise.all([getExercise(id), getExerciseRecords(id)]);
  if (!exercise) notFound();

  const hasData = records.best1RM > 0;

  return (
    <>
      <PageHeader title={titleCase(exercise.name)} subtitle="Records" back={`/exercises/${id}/progress`} />

      {!hasData ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="No records yet"
          description="Log some sets for this exercise to build your rep-max table."
          action={
            <Link href="/workout">
              <Button>Start a workout</Button>
            </Link>
          }
        />
      ) : (
        <div className="px-4 py-4 space-y-5">
          <Card className="p-5 text-center">
            <div className="text-xs text-subtle uppercase tracking-wide">Estimated 1RM</div>
            <div className="mt-1 text-4xl font-bold tabular-nums text-accent">
              {fmtWeight(records.best1RM)}
              <span className="text-xl text-muted ml-1">kg</span>
            </div>
            <p className="mt-2 text-xs text-muted">Based on your heaviest estimated set (Epley formula)</p>
          </Card>

          <Card className="overflow-hidden">
            <RecordsTable rows={records.rows} />
          </Card>
        </div>
      )}
    </>
  );
}
