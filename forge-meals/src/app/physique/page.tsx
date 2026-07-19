"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import type { PhysiquePhoto } from "@/lib/db/schema";
import { formatNumber } from "@/lib/utils";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhysiquePage() {
  const [photos, setPhotos] = useState<PhysiquePhoto[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/physique");
    const json = await res.json();
    setPhotos(json.photos ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) {
      setError("Add a photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/physique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: preview,
          date,
          weightKg: weight ? Number(weight) : null,
          bodyFatPct: bf ? Number(bf) : null,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      if (weight) {
        await fetch("/api/body-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            weightKg: Number(weight),
            bodyFatPct: bf ? Number(bf) : null,
          }),
        });
      }

      setPreview(null);
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--mute)]">
          Form
        </p>
        <h1 className="font-display mt-1 text-4xl">Physique</h1>
        <p className="mt-2 max-w-xl text-[var(--mute)]">
          Progress photos with date, weight, and body-fat % — your visual timeline.
        </p>
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="animate-rise panel grid gap-3 p-5 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label htmlFor="photo">Photo</label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void fileToDataUrl(f).then(setPreview);
              else setPreview(null);
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="mt-3 max-h-64 w-full rounded-xl object-cover"
            />
          ) : null}
        </div>
        <div>
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="w">Weight (kg)</label>
          <input
            id="w"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bf">Body fat %</label>
          <input
            id="bf"
            type="number"
            step="0.1"
            value={bf}
            onChange={(e) => setBf(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="notes">Notes</label>
          <input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lighting, pose, etc."
          />
        </div>
        {error ? (
          <p className="md:col-span-2 text-sm text-[var(--secondary)]">{error}</p>
        ) : null}
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save photo
          </button>
        </div>
      </form>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <article
            key={p.id}
            className="animate-rise panel overflow-hidden"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="relative aspect-[3/4] bg-black/40">
              <Image
                src={p.photoPath}
                alt={`Physique ${p.date}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-3">
              <p className="font-display text-lg">
                {format(parseISO(p.date), "d MMM yyyy")}
              </p>
              <p className="text-sm text-[var(--mute)]">
                {p.weightKg != null
                  ? `${formatNumber(p.weightKg, 1)} kg`
                  : "— kg"}
                {" · "}
                {p.bodyFatPct != null
                  ? `${formatNumber(p.bodyFatPct, 1)}% BF`
                  : "— BF"}
              </p>
              {p.notes ? (
                <p className="mt-1 text-xs text-[var(--mute)]">{p.notes}</p>
              ) : null}
            </div>
          </article>
        ))}
      </section>
      {photos.length === 0 ? (
        <div className="panel p-8 text-center text-[var(--mute)]">
          No physique photos yet.
        </div>
      ) : null}
    </div>
  );
}
