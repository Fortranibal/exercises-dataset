import Link from "next/link";
import { ClipboardList, ChevronRight, Dumbbell } from "lucide-react";
import { getRoutines } from "@/server/routines";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState } from "@/components/ui";
import { NewRoutineButton } from "@/components/routines/NewRoutineButton";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const routines = await getRoutines();

  return (
    <>
      <PageHeader
        title="Routines"
        subtitle={routines.length > 0 ? `${routines.length} saved` : undefined}
        action={<NewRoutineButton />}
      />

      {routines.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="No routines yet"
          description="Create routines like Push Day or Leg Day, then start them with one tap."
          action={<NewRoutineButton variant="full" />}
        />
      ) : (
        <div className="px-4 py-4 space-y-3">
          {routines.map((r) => (
            <Link key={r.id} href={`/routines/${r.id}`}>
              <Card className="p-4 hover:bg-elevated transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: r.color ?? "var(--color-accent-soft)" }}
                  >
                    {r.emoji ?? <Dumbbell size={20} className="text-accent" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-muted truncate">
                      {r.exerciseCount} exercise{r.exerciseCount === 1 ? "" : "s"}
                      {r.previewNames.length > 0 && (
                        <span className="text-subtle">
                          {" · "}
                          {r.previewNames.map((n) => titleCase(n)).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-subtle shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
