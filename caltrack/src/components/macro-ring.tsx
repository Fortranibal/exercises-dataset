"use client";

import { formatNumber } from "@/lib/utils";

type MacroRingProps = {
  value: number;
  target: number | null;
  label: string;
  unit?: string;
  color: string;
  size?: number;
  loading?: boolean;
};

export function MacroRing({
  value,
  target,
  label,
  unit = "",
  color,
  size = 118,
  loading = false,
}: MacroRingProps) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct =
    target && target > 0 ? Math.min(1.15, value / target) : 0;
  const capped = Math.min(1, pct);
  const offset = c * (1 - capped);
  const over = pct > 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={over ? "var(--warn)" : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={loading ? c : offset}
            className="animate-ring"
            style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-xl tabular-nums leading-none text-[#f4f4f5]">
            {loading ? "…" : formatNumber(Math.round(value))}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            {target != null ? `/ ${formatNumber(target)}${unit}` : "—"}
          </p>
        </div>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}
