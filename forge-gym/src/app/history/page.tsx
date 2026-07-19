import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ChevronRight, Dumbbell } from "lucide-react";
import { getWorkoutHistory, getTrainingDates } from "@/server/history";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState } from "@/components/ui";
import { TrainingCalendar } from "@/components/history/TrainingCalendar";
import { fmtDuration, fmtVolume, fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [workouts, dates] = await Promise.all([getWorkoutHistory(), getTrainingDates()]);

  return (
    <>
      <PageHeader title="History" back="/" subtitle={`${workouts.length} workouts`} />
      <div className="px-4 py-4 space-y-5">
        <TrainingCalendar dates={dates} />

        {workouts.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="No workouts logged yet"
            description="Completed workouts will appear here with full details."
          />
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => (
              <Link key={w.id} href={`/history/${w.id}`}>
                <Card className="p-4 hover:bg-elevated transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{w.name}</div>
                      <div className="text-xs text-muted">
                        {format(new Date(w.completedAt), "EEE, MMM d · HH:mm")}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-subtle shrink-0 mt-0.5" />
                  </div>

                  <div className="flex gap-4 mt-3 text-xs">
                    <Stat label="Volume" value={fmtVolume(w.totalVolume)} />
                    <Stat label="Sets" value={fmtNumber(w.totalSets)} />
                    <Stat label="Time" value={fmtDuration(w.durationSec)} />
                  </div>

                  {w.topExercises.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-subtle">
                      <Dumbbell size={13} />
                      <span className="truncate">{w.topExercises.join(", ")}</span>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-subtle">{label}</div>
      <div className="font-semibold text-fg tabular-nums">{value}</div>
    </div>
  );
}
