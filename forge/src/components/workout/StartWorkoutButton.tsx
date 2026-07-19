"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui";
import { startWorkout } from "@/server/actions/workouts";

export function StartWorkoutButton({
  routineId,
  label = "Start workout",
  className,
}: {
  routineId?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function start() {
    setBusy(true);
    const res = await startWorkout(routineId);
    if (res.ok && res.data) {
      router.push(`/workout/${res.data.id}`);
    } else {
      setBusy(false);
    }
  }

  return (
    <Button size="lg" className={className ?? "w-full shadow-lg shadow-accent/20"} onClick={start} disabled={busy}>
      <Play size={18} /> {busy ? "Starting…" : label}
    </Button>
  );
}
