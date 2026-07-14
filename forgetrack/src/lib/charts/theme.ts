/** Strict palette: primary · secondary · highlight · mute only. */
export const PALETTE = {
  primary: "#c8f07a",
  secondary: "#7db4ff",
  highlight: "#f4f4f5",
  mute: "#9a9aa6",
} as const;

/** Month ramp stays inside primary → secondary. */
export const MONTH_RAMP = [
  PALETTE.primary,
  "#b4e878",
  "#9ad0a8",
  "#8ac0cc",
  PALETTE.secondary,
  "#6aa0e8",
] as const;

export const CHART = {
  bg: "#0a0a0c",
  panel: "#111114",
  grid: "rgba(244,244,245,0.06)",
  axis: PALETTE.mute,
  title: PALETTE.highlight,
  muted: PALETTE.mute,
  ref: PALETTE.secondary,
  lean: "rgba(200,240,122,0.22)",
  leanStroke: PALETTE.primary,
  fat: "rgba(125,180,255,0.22)",
  fatStroke: PALETTE.secondary,
  protein: PALETTE.secondary,
  calOk: PALETTE.primary,
  /** Over target uses secondary — not a third hue */
  calOver: PALETTE.secondary,
  maintenance: PALETTE.mute,
} as const;

/** Shared dark tooltip — highlight text on dark panel. */
export const CHART_TOOLTIP = {
  contentStyle: {
    background: "#121216",
    border: "1px solid rgba(244,244,245,0.14)",
    borderRadius: 8,
    color: PALETTE.highlight,
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
  },
  labelStyle: { color: PALETTE.highlight, fontWeight: 600 },
  itemStyle: { color: PALETTE.highlight },
} as const;

/** Subtle bar hover using primary at low opacity. */
export const CHART_BAR_CURSOR = {
  fill: "rgba(200, 240, 122, 0.08)",
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
