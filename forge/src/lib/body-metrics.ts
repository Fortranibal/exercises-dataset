export const BODY_METRICS = [
  { key: "weight", label: "Body weight", unit: "kg" },
  { key: "bodyFat", label: "Body fat", unit: "%" },
  { key: "neck", label: "Neck", unit: "cm" },
  { key: "shoulders", label: "Shoulders", unit: "cm" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "upperArm", label: "Upper arm", unit: "cm" },
  { key: "biceps", label: "Biceps", unit: "cm" },
  { key: "forearm", label: "Forearm", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "thigh", label: "Thigh", unit: "cm" },
  { key: "calf", label: "Calf", unit: "cm" },
] as const;

export type BodyMetricKey = (typeof BODY_METRICS)[number]["key"];
export type GoalDirection = "increase" | "decrease" | "maintain";
export type MetricGoal = { target: number | null; direction: GoalDirection };

export function isBodyMetricKey(k: string): k is BodyMetricKey {
  return BODY_METRICS.some((m) => m.key === k);
}

export function metricMeta(key: BodyMetricKey) {
  return BODY_METRICS.find((m) => m.key === key)!;
}
