"use client";

import { ChevronDown } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { ExerciseFormState } from "@/components/workout/exercise-form-state";
import { ExerciseTypeFields } from "@/components/workout/exercise-type-fields";
import { cn } from "@/lib/utils";

export function ExerciseFormSettings({
  form,
  setForm,
  defaultOpen,
}: {
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (defaultOpen) {
    return (
      <section className="card-surface flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Настройки расчёта
          </h2>
          <p className="text-sm text-muted-foreground">
            Тип, шаг веса и разминка для подходов.
          </p>
        </div>
        <ExerciseTypeFields form={form} setForm={setForm} />
      </section>
    );
  }

  return (
    <section className="card-surface overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold tracking-tight">
            Настройки расчёта
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Тип, шаг веса, разминка
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-border/60 px-5 pb-5 pt-4">
          <ExerciseTypeFields form={form} setForm={setForm} />
        </div>
      ) : null}
    </section>
  );
}
