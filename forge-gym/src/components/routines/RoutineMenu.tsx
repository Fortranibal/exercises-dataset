"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { deleteRoutine, duplicateRoutine } from "@/server/actions/routines";

export function RoutineMenu({ routineId }: { routineId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onDuplicate() {
    setBusy(true);
    const res = await duplicateRoutine(routineId);
    setBusy(false);
    setOpen(false);
    if (res.ok && res.data) router.push(`/routines/${res.data.id}`);
  }

  async function onDelete() {
    if (!confirm("Delete this routine? This cannot be undone.")) return;
    setBusy(true);
    const res = await deleteRoutine(routineId);
    setBusy(false);
    if (res.ok) {
      router.push("/routines");
      router.refresh();
    }
  }

  return (
    <>
      <Button size="icon" variant="ghost" onClick={() => setOpen(true)} aria-label="Options">
        <MoreVertical size={20} />
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Routine options" size="sm">
        <div className="space-y-2">
          <button
            onClick={onDuplicate}
            disabled={busy}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-elevated transition-colors text-left disabled:opacity-50"
          >
            <Copy size={18} className="text-muted" />
            <span className="text-sm font-medium">Duplicate routine</span>
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-danger-soft transition-colors text-left disabled:opacity-50"
          >
            <Trash2 size={18} className="text-danger" />
            <span className="text-sm font-medium text-danger">Delete routine</span>
          </button>
        </div>
      </Sheet>
    </>
  );
}
