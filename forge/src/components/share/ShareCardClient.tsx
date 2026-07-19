"use client";

import * as React from "react";
import { format } from "date-fns";
import { toPng } from "html-to-image";
import { Download, Share2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui";
import { titleCase, fmtVolume, fmtNumber, fmtDuration, fmtWeight } from "@/lib/utils";

export type ShareData = {
  name: string;
  dateISO: string;
  durationSec: number;
  volume: number;
  sets: number;
  reps: number;
  topExercises: { name: string; sets: number; volume: number }[];
};

export function ShareCardClient({ data }: { data: ShareData }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  async function render(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#09090b",
    });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function onSave() {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await render();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forge-${format(new Date(data.dateISO), "yyyy-MM-dd")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Image saved");
    } catch {
      setStatus("Could not generate image");
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await render();
      if (!blob) return;
      const file = new File([blob], "forge-workout.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: data.name });
        setStatus(null);
      } else {
        await onSave();
      }
    } catch {
      setStatus("Sharing was cancelled");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* The card to capture */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #1c1733 0%, #09090b 55%, #0f1f1a 100%)",
          }}
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                <Dumbbell size={18} className="text-accent-fg" />
              </div>
              <span className="font-extrabold tracking-tight text-lg">
                FORGE
              </span>
              <span className="ml-auto text-xs text-muted">
                {format(new Date(data.dateISO), "MMM d, yyyy")}
              </span>
            </div>

            <div className="mb-6">
              <div className="text-2xl font-bold leading-tight">{data.name}</div>
              <div className="text-sm text-muted">{fmtDuration(data.durationSec)} session</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <CardStat label="Volume" value={fmtVolume(data.volume)} />
              <CardStat label="Sets" value={fmtNumber(data.sets)} />
              <CardStat label="Reps" value={fmtNumber(data.reps)} />
            </div>

            {data.topExercises.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-subtle">Top lifts</div>
                {data.topExercises.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-2">{titleCase(e.name)}</span>
                    <span className="text-muted tabular-nums shrink-0">
                      {e.sets} × · {fmtWeight(e.volume)} kg
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-subtle">
              Tracked with Forge
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
        <Button variant="secondary" onClick={onSave} disabled={busy}>
          <Download size={16} /> Save
        </Button>
        <Button onClick={onShare} disabled={busy}>
          <Share2 size={16} /> {busy ? "Working…" : "Share"}
        </Button>
      </div>
      {status && <p className="text-center text-xs text-muted">{status}</p>}
    </div>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 text-center">
      <div className="text-lg font-bold tabular-nums leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-subtle mt-0.5">{label}</div>
    </div>
  );
}
