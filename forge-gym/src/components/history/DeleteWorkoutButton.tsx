"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { deleteWorkout } from "@/server/actions/workouts";

export function DeleteWorkoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onDelete() {
    if (!confirm("Delete this workout from your history?")) return;
    setBusy(true);
    const res = await deleteWorkout(id);
    if (res.ok) {
      router.push("/history");
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={onDelete} disabled={busy} aria-label="Delete workout">
      <Trash2 size={18} className="text-danger" />
    </Button>
  );
}
