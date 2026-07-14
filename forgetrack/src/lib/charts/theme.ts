/** Month color ramp matching the reference ridge plots (green → purple). */
export const MONTH_RAMP = [
  "#b8f26d", // early
  "#3ecfbf",
  "#3b7ddd",
  "#5b4fd6",
  "#9b3de8",
  "#d946ef",
] as const;

export const CHART = {
  bg: "#0a0a0c",
  panel: "#111114",
  grid: "rgba(255,255,255,0.06)",
  axis: "#8b8b96",
  title: "#f4f4f5",
  muted: "#9a9aa6",
  ref: "#f472b6",
  lean: "#1a4d3a",
  leanStroke: "#2d6a4f",
  fat: "#b8956a",
  fatStroke: "#c4a574",
  protein: "#7db4ff",
  calOk: "#9fe870",
  calOver: "#f07178",
  maintenance: "#fbbf24",
} as const;

export function monthColor(monthKey: string, allMonths: string[]): string {
  const sorted = [...allMonths].sort();
  const idx = Math.max(0, sorted.indexOf(monthKey));
  if (sorted.length <= 1) return MONTH_RAMP[0];
  const t = idx / (sorted.length - 1);
  const pos = t * (MONTH_RAMP.length - 1);
  const i = Math.floor(pos);
  return MONTH_RAMP[Math.min(i, MONTH_RAMP.length - 1)];
}

export function kde(values: number[], x: number, bandwidth: number): number {
  if (values.length === 0) return 0;
  const inv = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
  let sum = 0;
  for (const v of values) {
    const u = (x - v) / bandwidth;
    sum += Math.exp(-0.5 * u * u);
  }
  return inv * sum;
}
