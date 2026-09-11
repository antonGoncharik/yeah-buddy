"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import type { ExerciseFormState } from "@/components/workout/exercise-form-state";

export function ExerciseIdentityFields({
  form,
  setForm,
  showActive,
  active,
  toggling,
  onToggleActive,
}: {
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  showActive: boolean;
  active: boolean;
  toggling: boolean;
  onToggleActive: (next: boolean) => void;
}) {
  return (
    <>
      <Field label="Название">
        <Input
          required
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          className="h-12 text-base"
        />
      </Field>

      <Field label="Кратко">
        <Input
          value={form.short_name}
          placeholder="жим"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              short_name: event.target.value,
            }))
          }
          className="h-12 text-base"
        />
      </Field>

      {showActive ? (
        <Field label="В тренировках">
          <Segmented
            value={active ? "yes" : "no"}
            disabled={toggling}
            options={[
              { id: "yes", label: "Делаю" },
              { id: "no", label: "Не делаю" },
            ]}
            onChange={(value) => onToggleActive(value === "yes")}
          />
        </Field>
      ) : null}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>
      {children}
    </div>
  );
}
