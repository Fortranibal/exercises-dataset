"use client";

/**
 * Landmark % of the cropped opaque figure.
 * Figure box must match PNG aspect (~577×990) so % maps 1:1 onto the body.
 */
const ASPECT = "577 / 990";

const L = {
  crown: { x: 50, y: 1.2 },
  heel: { x: 50, y: 98.8 },
  head: { x: 50, y: 7.0 },
  chest: { x: 50, y: 26 },
  abdomen: { x: 50, y: 42 },
  // Arms hang at sides — white wrist bands sit near the outer edges ~y48
  wrist: { x: 90, y: 48 },
  knee: { x: 39, y: 67 },
  ankle: { x: 62, y: 90 },
} as const;

type Tone = "primary" | "secondary";

type Chip = {
  id: string;
  label: string;
  value: string;
  tone: Tone;
  side: "left" | "right";
  ay: number;
  tx: number;
  ty: number;
};

export type BodyAnatomyProps = {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: "M" | "F";
  bodyFatPct: number | null;
  wristCm: number;
  kneeCm: number;
  ankleCm: number;
};

function toneVar(tone: Tone) {
  return tone === "primary" ? "var(--primary)" : "var(--secondary)";
}

export function BodyAnatomy({
  heightCm,
  weightKg,
  age,
  gender,
  bodyFatPct,
  wristCm,
  kneeCm,
  ankleCm,
}: BodyAnatomyProps) {
  const chips: Chip[] = [
    {
      id: "age",
      label: "Age",
      value: `${age} yrs`,
      tone: "secondary",
      side: "left",
      ay: L.head.y,
      tx: L.head.x,
      ty: L.head.y,
    },
    {
      id: "gender",
      label: "Gender",
      value: gender === "M" ? "Male" : "Female",
      tone: "secondary",
      side: "left",
      ay: L.abdomen.y,
      tx: L.abdomen.x,
      ty: L.abdomen.y,
    },
    {
      id: "knee",
      label: "Knee",
      value: `${kneeCm.toFixed(1)} cm`,
      tone: "secondary",
      side: "left",
      ay: L.knee.y,
      tx: L.knee.x,
      ty: L.knee.y,
    },
    {
      id: "weight",
      label: "Weight",
      value: `${weightKg.toFixed(1)} kg`,
      tone: "primary",
      side: "right",
      ay: L.chest.y,
      tx: L.chest.x,
      ty: L.chest.y,
    },
    {
      id: "wrist",
      label: "Wrist",
      value: `${wristCm.toFixed(1)} cm`,
      tone: "secondary",
      side: "right",
      ay: L.wrist.y,
      tx: L.wrist.x,
      ty: L.wrist.y,
    },
    {
      id: "ankle",
      label: "Ankle",
      value: `${ankleCm.toFixed(1)} cm`,
      tone: "secondary",
      side: "right",
      ay: L.ankle.y,
      tx: L.ankle.x,
      ty: L.ankle.y,
    },
  ];

  const leftChips = chips.filter((c) => c.side === "left");
  const rightChips = chips.filter((c) => c.side === "right");

  return (
    <div className="overflow-hidden rounded-2xl border border-[color:color-mix(in_oklab,var(--border)_80%,transparent)] bg-[color:color-mix(in_oklab,var(--card)_88%,transparent)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="relative isolate bg-[#050505]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_58%)]" />

        <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-3 sm:px-5 sm:pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Height
            </p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--highlight)] sm:text-3xl">
              {heightCm}
              <span className="ml-1.5 text-sm font-medium text-[var(--mute)]">cm</span>
            </p>
          </div>
          <p className="pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--mute)]">
            crown → heel
          </p>
        </div>

        <div className="relative z-10 flex items-stretch justify-center gap-1.5 px-2 pb-3 pt-1 sm:gap-2.5 sm:px-4">
          <div className="relative w-[5.5rem] shrink-0 sm:w-[6.25rem]" style={{ height: "min(72vh, 620px)" }}>
            {leftChips.map((c) => (
              <ChipCard key={c.id} chip={c} />
            ))}
          </div>

          <div
            className="relative shrink-0"
            style={{
              height: "min(72vh, 620px)",
              aspectRatio: ASPECT,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/muscle-anatomy.png"
              alt="Anatomical muscle-fiber figure"
              className="absolute inset-0 h-full w-full object-fill select-none"
              draggable={false}
            />

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <line
                x1={12}
                y1={L.crown.y}
                x2={12}
                y2={L.heel.y}
                stroke="var(--primary)"
                strokeWidth={0.55}
                strokeLinecap="round"
                opacity={0.9}
              />
              <line
                x1={12}
                y1={L.crown.y}
                x2={L.crown.x - 8}
                y2={L.crown.y}
                stroke="var(--primary)"
                strokeWidth={0.3}
                opacity={0.5}
              />
              <line
                x1={12}
                y1={L.heel.y}
                x2={L.heel.x - 8}
                y2={L.heel.y}
                stroke="var(--primary)"
                strokeWidth={0.3}
                opacity={0.5}
              />
              <circle cx={12} cy={L.crown.y} r={1.15} fill="var(--primary)" />
              <circle cx={12} cy={L.heel.y} r={1.15} fill="var(--primary)" />

              {chips.map((c) => {
                const edgeX = c.side === "left" ? -4 : 104;
                const color = toneVar(c.tone);
                return (
                  <g key={c.id}>
                    <path
                      d={`M ${edgeX} ${c.ay} L ${c.tx} ${c.ty}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={0.42}
                      strokeLinecap="round"
                      opacity={0.75}
                    />
                    <circle cx={c.tx} cy={c.ty} r={1.65} fill={color} />
                    <circle
                      cx={c.tx}
                      cy={c.ty}
                      r={2.9}
                      fill="none"
                      stroke={color}
                      strokeWidth={0.35}
                      opacity={0.45}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="relative w-[5.5rem] shrink-0 sm:w-[6.25rem]" style={{ height: "min(72vh, 620px)" }}>
            {rightChips.map((c) => (
              <ChipCard key={c.id} chip={c} />
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] bg-[color:color-mix(in_oklab,var(--card)_92%,transparent)] px-4 py-3 backdrop-blur-md sm:px-5 sm:py-3.5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
                Body fat · estimated
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--highlight)] sm:text-3xl">
                {bodyFatPct != null ? (
                  <>
                    {bodyFatPct.toFixed(1)}
                    <span className="ml-1.5 text-sm font-medium text-[var(--mute)]">%</span>
                  </>
                ) : (
                  <span className="text-base text-[var(--mute)]">—</span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--mute)]">
                From height, weight, age & gender
              </p>
            </div>
            <div className="flex gap-4 text-right sm:gap-6">
              {(
                [
                  ["Wrist", wristCm],
                  ["Knee", kneeCm],
                  ["Ankle", ankleCm],
                ] as const
              ).map(([label, val]) => (
                <div key={label}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--mute)]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--highlight)]">
                    {val.toFixed(1)}
                    <span className="ml-1 text-[10px] font-medium text-[var(--mute)]">cm</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipCard({ chip }: { chip: Chip }) {
  const color = toneVar(chip.tone);
  return (
    <div
      className="absolute left-0 right-0 z-20 -translate-y-1/2 rounded-lg border px-2 py-1.5 backdrop-blur-md sm:px-2.5"
      style={{
        top: `${chip.ay}%`,
        borderColor: `color-mix(in oklab, ${color} 42%, transparent)`,
        background: `color-mix(in oklab, var(--card) 88%, transparent)`,
        boxShadow: `0 0 18px color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color }}>
        {chip.label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums tracking-tight text-[var(--highlight)] sm:text-sm">
        {chip.value}
      </p>
    </div>
  );
}
