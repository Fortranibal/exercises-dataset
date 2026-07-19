import Link from "next/link";
import { Play } from "lucide-react";
import { getActiveWorkout } from "@/server/workouts";
import { getRoutines } from "@/server/routines";
import { PageHeader } from "@/components/PageHeader";
import { WorkoutStartOptions } from "@/components/workout/WorkoutStartOptions";

export const dynamic = "force-dynamic";

export default async function WorkoutPage() {
  const [active, routines] = await Promise.all([getActiveWorkout(), getRoutines()]);

  return (
    <>
      <PageHeader title="Workout" back="/" />
      <div className="px-4 py-4 space-y-5">
        {active && (
          <Link href={`/workout/${active.id}`} className="block">
            <div className="rounded-3xl bg-gradient-to-br from-success to-emerald-600 p-5 text-black shadow-lg active:scale-[0.99] transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Workout in progress</div>
                  <div className="text-sm opacity-80">Tap to resume your session</div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-black/15 flex items-center justify-center">
                  <Play size={26} />
                </div>
              </div>
            </div>
          </Link>
        )}
        <WorkoutStartOptions routines={routines} />
      </div>
    </>
  );
}
