/** Strength math: estimated 1RM and N-rep-max projections (Epley formula). */

/** Estimated 1RM from a working set. */
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Project the weight for an N-rep max from an estimated 1RM. */
export function weightForRM(oneRM: number, n: number): number {
  if (oneRM <= 0 || n <= 0) return 0;
  if (n === 1) return oneRM;
  return oneRM / (1 + n / 30);
}

/** Estimate the N-rep-max weight directly from a working set. */
export function estimateRM(weight: number, reps: number, n: number): number {
  return weightForRM(epley1RM(weight, reps), n);
}

export const DEFAULT_RM_RANGE = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
export const EXTENDED_RM_RANGE = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20
