"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { deleteCustomExercise } from "@/server/actions/exercises";

export function DeleteExerciseButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    if (!confirm("Delete this custom exercise?")) return;
    setBusy(true);
    const res = await deleteCustomExercise(id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/exercises");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="icon" onClick={onDelete} disabled={busy} aria-label="Delete">
        <Trash2 size={18} className="text-danger" />
      </Button>
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
