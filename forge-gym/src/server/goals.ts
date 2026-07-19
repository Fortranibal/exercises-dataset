import { startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { primaryGroup } from "@/lib/muscles";

export type GoalType = "workouts_per_week" | "volume_per_week" | "sets_per_week";

export type GoalWithProgress = {
  id: string;
  type: GoalType;
  target: number;
  muscleGroup: string | null;
  current: number;
  unit: string;
  label: string;
};

const TYPE_LABEL: Record<GoalType, string> = {
  workouts_per_week: "Workouts",
  volume_per_week: "Volume",
  sets_per_week: "Sets",
};

const TYPE_UNIT: Record<GoalType, string> = {
  workouts_per_week: "",
  volume_per_week: "kg",
  sets_per_week: "",
};

export function goalTypeLabel(type: GoalType): string {
  return TYPE_LABEL[type];
}
export function goalTypeUnit(type: GoalType): string {
  return TYPE_UNIT[type];
}

export async function getGoalsWithProgress(): Promise<GoalWithProgress[]> {
  const goals = await prisma.goal.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (goals.length === 0) return [];

  const from = startOfWeek(new Date(), { weekStartsOn: 1 });
  const workouts = await prisma.workout.findMany({
    where: { completedAt: { not: null, gte: from } },
    include: {
      exercises: {
        include: { sets: true, exercise: { select: { target: true } } },
      },
    },
  });

  let weekWorkouts = 0;
  let weekVolume = 0;
  let weekSets = 0;
  const setsByGroup = new Map<string, number>();
  weekWorkouts = workouts.length;
  for (const w of workouts) {
    for (const we of w.exercises) {
      const group = primaryGroup(we.exercise.target);
      for (const s of we.sets) {
        weekSets += 1;
        weekVolume += s.weight * s.reps;
        setsByGroup.set(group, (setsByGroup.get(group) ?? 0) + 1);
      }
    }
  }

  return goals.map((g) => {
    const type = g.type as GoalType;
    let current = 0;
    switch (type) {
      case "workouts_per_week":
        current = weekWorkouts;
        break;
      case "volume_per_week":
        current = Math.round(weekVolume);
        break;
      case "sets_per_week":
        current = g.muscleGroup ? (setsByGroup.get(g.muscleGroup) ?? 0) : weekSets;
        break;
      default: {
        const _exhaustive: never = type;
        current = _exhaustive;
      }
    }
    return {
      id: g.id,
      type,
      target: g.target,
      muscleGroup: g.muscleGroup,
      current,
      unit: TYPE_UNIT[type],
      label: g.muscleGroup ? `${TYPE_LABEL[type]} · ${g.muscleGroup}` : TYPE_LABEL[type],
    };
  });
}
