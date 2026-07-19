/**
 * Maps the dataset's many muscle strings (target, muscle_group, secondary_muscles)
 * into a small set of canonical groups used across analytics + charts.
 */

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Traps",
  "Biceps",
  "Triceps",
  "Forearms",
  "Core",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Cardio",
  "Other",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Chest: "#7c5cff",
  Back: "#38bdf8",
  Shoulders: "#22c55e",
  Traps: "#14b8a6",
  Biceps: "#f59e0b",
  Triceps: "#fb7185",
  Forearms: "#eab308",
  Core: "#a78bfa",
  Quads: "#f97316",
  Hamstrings: "#ec4899",
  Glutes: "#06b6d4",
  Calves: "#84cc16",
  Cardio: "#ef4444",
  Other: "#71717a",
};

const KEYWORD_MAP: Array<[RegExp, MuscleGroup]> = [
  [/pectoral|chest/, "Chest"],
  [/lat|latissimus|upper back|lower back|spine|erector|rhomboid|teres|trapez|traps/, "Back"],
  [/levator|trapezius/, "Traps"],
  [/delt|shoulder|rotator cuff/, "Shoulders"],
  [/bicep|brachial/, "Biceps"],
  [/tricep/, "Triceps"],
  [/forearm|wrist|grip/, "Forearms"],
  [/abs|abdominal|oblique|core|serratus/, "Core"],
  [/quadricep|quads/, "Quads"],
  [/hamstring/, "Hamstrings"],
  [/glute|hip flexor|adductor|abductor|hips/, "Glutes"],
  [/calf|calves|soleus|gastrocnemius|ankle/, "Calves"],
  [/cardio|cardiovascular/, "Cardio"],
];

// "traps"/"trapezius" should resolve to Traps before Back's broad rule.
const PRIORITY_MAP: Array<[RegExp, MuscleGroup]> = [
  [/trapez|traps|levator/, "Traps"],
];

export function normalizeMuscle(raw: string | null | undefined): MuscleGroup {
  if (!raw) return "Other";
  const v = raw.toLowerCase().trim();
  for (const [re, group] of PRIORITY_MAP) {
    if (re.test(v)) return group;
  }
  for (const [re, group] of KEYWORD_MAP) {
    if (re.test(v)) return group;
  }
  return "Other";
}

/**
 * Distribute a set's volume across muscle groups.
 * Primary target receives 65%; secondary muscles split the remaining 35%.
 */
export function attributeVolume(
  target: string,
  secondaryMuscles: string[],
  volume: number,
): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {};
  const add = (g: MuscleGroup, v: number) => {
    out[g] = (out[g] ?? 0) + v;
  };

  const primary = normalizeMuscle(target);
  if (secondaryMuscles.length === 0) {
    add(primary, volume);
    return out;
  }

  add(primary, volume * 0.65);
  const share = (volume * 0.35) / secondaryMuscles.length;
  for (const m of secondaryMuscles) {
    add(normalizeMuscle(m), share);
  }
  return out;
}

/** Set-count attribution: 1 set credited to the primary muscle group. */
export function primaryGroup(target: string): MuscleGroup {
  return normalizeMuscle(target);
}
