"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { createCustomExercise } from "@/server/actions/exercises";
import { titleCase } from "@/lib/utils";
import type { FacetValue } from "@/server/exercises";

export function CreateExerciseSheet({
  open,
  onClose,
  facets,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  facets: { bodyParts: FacetValue[]; equipment: FacetValue[]; targets: FacetValue[] };
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [bodyPart, setBodyPart] = React.useState("");
  const [equipment, setEquipment] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setName("");
    setBodyPart("");
    setEquipment("");
    setTarget("");
    setInstructions("");
    setError(null);
  }

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Please enter a name");
    if (!bodyPart.trim()) return setError("Please choose a body part");
    if (!equipment.trim()) return setError("Please choose equipment");
    if (!target.trim()) return setError("Please choose a target muscle");

    setSubmitting(true);
    const res = await createCustomExercise({
      name,
      bodyPart,
      equipment,
      target,
      secondaryMuscles: [],
      instructionsEn: instructions,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    onCreated?.(res.data!.id);
    reset();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New exercise"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="ex-name">Name</Label>
          <Input
            id="ex-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Incline cable fly"
            autoFocus
          />
        </div>

        <DatalistField
          id="ex-bodypart"
          label="Body part"
          value={bodyPart}
          onChange={setBodyPart}
          options={facets.bodyParts}
          placeholder="e.g. chest"
        />
        <DatalistField
          id="ex-equipment"
          label="Equipment"
          value={equipment}
          onChange={setEquipment}
          options={facets.equipment}
          placeholder="e.g. cable"
        />
        <DatalistField
          id="ex-target"
          label="Target muscle"
          value={target}
          onChange={setTarget}
          options={facets.targets}
          placeholder="e.g. pectorals"
        />

        <div>
          <Label htmlFor="ex-instructions">Instructions (optional)</Label>
          <Textarea
            id="ex-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="How to perform this exercise…"
            rows={4}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}

function DatalistField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FacetValue[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        list={`${id}-list`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <datalist id={`${id}-list`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {titleCase(o.value)}
          </option>
        ))}
      </datalist>
    </div>
  );
}
