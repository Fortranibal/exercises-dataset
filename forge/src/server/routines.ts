import { prisma } from "@/lib/prisma";

export type RoutineListItem = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  exerciseCount: number;
  previewNames: string[];
};

export type RoutineExerciseDTO = {
  routineExerciseId: string;
  exerciseId: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  image: string | null;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  notes: string | null;
};

export type RoutineDetail = {
  id: string;
  name: string;
  notes: string | null;
  emoji: string | null;
  color: string | null;
  exercises: RoutineExerciseDTO[];
};

export async function getRoutines(): Promise<RoutineListItem[]> {
  const routines = await prisma.routine.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        select: { exercise: { select: { name: true } } },
      },
    },
  });

  return routines.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    color: r.color,
    exerciseCount: r.exercises.length,
    previewNames: r.exercises.slice(0, 4).map((e) => e.exercise.name),
  }));
}

export async function getRoutine(id: string): Promise<RoutineDetail | null> {
  const r = await prisma.routine.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              bodyPart: true,
              target: true,
              equipment: true,
              image: true,
            },
          },
        },
      },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    name: r.name,
    notes: r.notes,
    emoji: r.emoji,
    color: r.color,
    exercises: r.exercises.map((re) => ({
      routineExerciseId: re.id,
      exerciseId: re.exerciseId,
      name: re.exercise.name,
      bodyPart: re.exercise.bodyPart,
      target: re.exercise.target,
      equipment: re.exercise.equipment,
      image: re.exercise.image,
      sortOrder: re.sortOrder,
      defaultSets: re.defaultSets,
      defaultReps: re.defaultReps,
      defaultWeight: re.defaultWeight,
      notes: re.notes,
    })),
  };
}
