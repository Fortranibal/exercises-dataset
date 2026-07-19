import { prisma } from "@/lib/prisma";
import { toExerciseDTO, type ExerciseDTO } from "@/lib/exercise";
import type { Prisma } from "@prisma/client";

export type ExerciseListItem = {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  image: string | null;
  gifUrl: string | null;
  isCustom: boolean;
};

export type ExerciseFilters = {
  q?: string;
  bodyPart?: string;
  equipment?: string;
  target?: string;
  customOnly?: boolean;
};

export type FacetValue = { value: string; count: number };

const LIST_SELECT = {
  id: true,
  name: true,
  bodyPart: true,
  equipment: true,
  target: true,
  image: true,
  gifUrl: true,
  isCustom: true,
} satisfies Prisma.ExerciseSelect;

function buildWhere(filters: ExerciseFilters): Prisma.ExerciseWhereInput {
  const where: Prisma.ExerciseWhereInput = {};
  if (filters.q && filters.q.trim()) {
    where.name = { contains: filters.q.trim().toLowerCase() };
  }
  if (filters.bodyPart) where.bodyPart = filters.bodyPart;
  if (filters.equipment) where.equipment = filters.equipment;
  if (filters.target) where.target = filters.target;
  if (filters.customOnly) where.isCustom = true;
  return where;
}

export async function queryExercises(
  filters: ExerciseFilters,
  page = 0,
  take = 30,
): Promise<{ items: ExerciseListItem[]; nextPage: number | null; total: number }> {
  const where = buildWhere(filters);
  const [items, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      select: LIST_SELECT,
      orderBy: [{ isCustom: "desc" }, { name: "asc" }],
      skip: page * take,
      take: take + 1,
    }),
    prisma.exercise.count({ where }),
  ]);

  const hasMore = items.length > take;
  return {
    items: hasMore ? items.slice(0, take) : items,
    nextPage: hasMore ? page + 1 : null,
    total,
  };
}

export async function getExercise(id: string): Promise<ExerciseDTO | null> {
  const e = await prisma.exercise.findUnique({ where: { id } });
  return e ? toExerciseDTO(e) : null;
}

function tally(values: string[]): FacetValue[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getFilterFacets(): Promise<{
  bodyParts: FacetValue[];
  equipment: FacetValue[];
  targets: FacetValue[];
}> {
  const rows = await prisma.exercise.findMany({
    select: { bodyPart: true, equipment: true, target: true },
  });
  return {
    bodyParts: tally(rows.map((r) => r.bodyPart)),
    equipment: tally(rows.map((r) => r.equipment)),
    targets: tally(rows.map((r) => r.target)),
  };
}
