"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button, Input, Label } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { addMeasurement } from "@/server/actions/body";
import { BODY_METRICS, type BodyMetricKey } from "@/lib/body-metrics";

export function LogMeasurementSheet({
  open,
  onClose,
  placeholders = {},
  focusMetric,
}: {
  open: boolean;
  onClose: () => void;
  placeholders?: Partial<Record<BodyMetricKey, number | null>>;
  focusMetric?: BodyMetricKey;
}) {
  const router = useRouter();
  const [date, setDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const metrics = focusMetric ? BODY_METRICS.filter((m) => m.key === focusMetric) : BODY_METRICS;

  async function submit() {
    setError(null);
    const parsed: Partial<Record<BodyMetricKey, number>> = {};
    for (const m of BODY_METRICS) {
      const raw = values[m.key];
      if (raw !== undefined && raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0) parsed[m.key] = n;
      }
    }
    if (Object.keys(parsed).length === 0) {
      setError("Enter at least one value");
      return;
    }
    setBusy(true);
    const res = await addMeasurement({ measuredAt: new Date(date).toISOString(), values: parsed });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    setValues({});
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log measurement"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="m-date">Date</Label>
          <Input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.key}>
              <Label htmlFor={`m-${m.key}`}>
                {m.label} <span className="text-subtle">({m.unit})</span>
              </Label>
              <Input
                id={`m-${m.key}`}
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0}
                value={values[m.key] ?? ""}
                placeholder={placeholders[m.key] != null ? String(placeholders[m.key]) : "—"}
                onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}
