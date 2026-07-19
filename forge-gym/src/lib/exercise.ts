import type { Exercise } from "@prisma/client";

export type Lang = "en" | "es" | "it" | "tr";

export type ExerciseDTO = {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  instructions: Partial<Record<Lang, string>>;
  instructionSteps: Partial<Record<Lang, string[]>>;
  image: string | null;
  gifUrl: string | null;
  isCustom: boolean;
};

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toExerciseDTO(e: Exercise): ExerciseDTO {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    bodyPart: e.bodyPart,
    equipment: e.equipment,
    target: e.target,
    muscleGroup: e.muscleGroup,
    secondaryMuscles: safeParse<string[]>(e.secondaryMuscles, []),
    instructions: safeParse<Partial<Record<Lang, string>>>(e.instructions, {}),
    instructionSteps: safeParse<Partial<Record<Lang, string[]>>>(e.instructionSteps, {}),
    image: e.image,
    gifUrl: e.gifUrl,
    isCustom: e.isCustom,
  };
}

/** Build a public URL for a media path stored like "images/x.jpg". */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/${path}`;
}

export function parseSecondaryMuscles(json: string | null | undefined): string[] {
  return safeParse<string[]>(json, []);
}
