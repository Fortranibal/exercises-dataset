import type { WorkoutDetail } from "@/server/workouts";

export type WorkoutStatTotals = {
  sets: number;
  reps: number;
  volume: number;
};

export function workoutStats(w: WorkoutDetail): WorkoutStatTotals {
  let sets = 0;
  let reps = 0;
  let volume = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      if (s.isCompleted) {
        sets += 1;
        reps += s.reps;
        volume += s.weight * s.reps;
      }
    }
  }
  return { sets, reps, volume };
}
