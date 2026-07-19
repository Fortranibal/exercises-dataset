import Link from "next/link";
import { format } from "date-fns";
import { Dumbbell, ClipboardList, BarChart3, User, Plus, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getWorkoutHistory } from "@/server/history";
import { getGoalsWithProgress } from "@/server/goals";
import { Card, Stat } from "@/components/ui";
import { ProgressRing } from "@/components/goals/ProgressRing";
import { fmtNumber, fmtVolume, fmtDuration, pct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [exerciseCount, routineCount, workoutCount, recent, goals] = await Promise.all([
    prisma.exercise.count(),
    prisma.routine.count(),
    prisma.workout.count({ where: { completedAt: { not: null } } }),
    getWorkoutHistory(3),
    getGoalsWithProgress(),
  ]);

  return (
    <div className="px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight">Forge Gym</h1>
        </div>
        <Link
          href="/profile"
          className="h-10 w-10 rounded-full bg-elevated2 flex items-center justify-center text-muted"
        >
          <User size={20} />
        </Link>
      </header>

      {/* Start workout CTA */}
      <Link href="/workout" className="block">
        <div className="rounded-3xl bg-gradient-to-br from-accent to-accent-strong p-5 text-accent-fg shadow-lg shadow-accent/20 active:scale-[0.99] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Start Workout</div>
              <div className="text-sm opacity-90">Empty session or from a routine</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus size={26} />
            </div>
          </div>
        </div>
      </Link>

      {/* Weekly goals */}
      {goals.length > 0 && (
        <Link href="/goals" className="block">
          <Card className="p-4">
            <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              This week
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar">
              {goals.map((g) => (
                <div key={g.id} className="flex flex-col items-center gap-1.5 shrink-0">
                  <ProgressRing value={g.current} target={g.target} size={72} stroke={7}>
                    <span className="text-sm font-bold tabular-nums">{pct(g.current, g.target)}%</span>
                  </ProgressRing>
                  <span className="text-xs text-muted text-center max-w-[80px] truncate">{g.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Link>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Workouts" value={fmtNumber(workoutCount)} />
        <Stat label="Routines" value={fmtNumber(routineCount)} />
        <Stat label="Exercises" value={fmtNumber(exerciseCount)} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <QuickLink href="/routines" icon={<ClipboardList size={22} />} title="Routines" desc="Plan your splits" />
        <QuickLink href="/exercises" icon={<Dumbbell size={22} />} title="Exercises" desc="Browse library" />
        <QuickLink href="/analytics" icon={<BarChart3 size={22} />} title="Analytics" desc="Track progress" />
        <QuickLink href="/profile" icon={<User size={22} />} title="Body & Records" desc="Measurements" />
      </div>

      {/* Recent workouts */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Recent workouts
            </h2>
            <Link href="/history" className="text-xs text-accent font-medium">
              See all
            </Link>
          </div>
          <div className="space-y-2.5">
            {recent.map((w) => (
              <Link key={w.id} href={`/history/${w.id}`}>
                <Card className="p-3.5 hover:bg-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{w.name}</div>
                      <div className="text-xs text-muted">
                        {format(new Date(w.completedAt), "MMM d")} · {fmtVolume(w.totalVolume)} ·{" "}
                        {fmtDuration(w.durationSec)}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-subtle shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 h-full hover:bg-elevated transition-colors">
        <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent mb-3">
          {icon}
        </div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted">{desc}</div>
      </Card>
    </Link>
  );
}
