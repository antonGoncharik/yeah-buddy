"use client";

import { useEffect, useState } from "react";

import type { MacroRecap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PHASE_TYPE_LABELS } from "@/lib/workout/labels";
import {
  formatSignedPercent,
  formatSignedWeight,
  formatWeight,
} from "@/lib/workout/numbers";

export function MacroRecapCard({
  recap,
  featured = false,
}: {
  recap: MacroRecap;
  featured?: boolean;
}) {
  const [open, setOpen] = useState(featured);

  useEffect(() => {
    if (featured) {
      setOpen(true);
    }
  }, [featured]);
  const avg = recap.avg_percent;
  const headline =
    avg == null
      ? "Итоги макроцикла"
      : avg > 0
        ? "Стал сильнее"
        : avg < 0
          ? "Максимумы снизились"
          : "Максимумы те же";

  return (
    <section
      className={cn(
        "card-surface flex flex-col gap-3 px-5 py-5",
        featured && "motion-safe:animate-recap-glow",
      )}
    >
      <button
        type="button"
        className="flex w-full flex-col gap-1 text-left"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <p className="text-sm font-medium text-muted-foreground">
          Макроцикл №{recap.number} · {PHASE_TYPE_LABELS[recap.from_phase]} →{" "}
          {PHASE_TYPE_LABELS[recap.to_phase]}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">{headline}</h2>
        <p className="text-base">
          {avg == null ? (
            "Нет сравнения максимумов"
          ) : (
            <>
              <span
                className={cn(
                  "text-xl font-semibold",
                  avg > 0 && "text-primary",
                )}
              >
                {formatSignedPercent(avg)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                в среднем
                {recap.grown_count > 0
                  ? ` · выросли ${recap.grown_count} из ${recap.gains.length}`
                  : ` · ${recap.gains.length} упр.`}
              </span>
            </>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {open ? "Скрыть упражнения" : "Показать приросты"}
        </p>
      </button>

      {open ? (
        <ul className="flex flex-col gap-3">
          {recap.gains.map((gain) => (
            <li key={gain.exercise_id} className="flex flex-col gap-0.5">
              <p className="text-base font-medium">{gain.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatWeight(gain.start_weight)} →{" "}
                {formatWeight(gain.end_weight)} кг
                <span
                  className={cn(
                    "ml-2 font-medium",
                    gain.delta > 0 && "text-primary",
                    gain.delta < 0 && "text-destructive",
                  )}
                >
                  {formatSignedWeight(gain.delta)} кг
                  {gain.percent == null
                    ? ""
                    : ` · ${formatSignedPercent(gain.percent)}`}
                </span>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
