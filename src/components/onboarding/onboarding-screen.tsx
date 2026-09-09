"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { writeJson } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import { formatKcal, macroGoalsFromProtein } from "@/lib/nutrition";
import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding-map";
import { cn } from "@/lib/utils";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

const PROTEIN_PRESETS = [100, 120, 150] as const;

type Step = "food" | "circle" | "maxes";

export function OnboardingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replay = searchParams.get("again") === "1";
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("food");
  const [protein, setProtein] = useState("120");
  const [skipFood, setSkipFood] = useState(false);
  const [circle, setCircle] = useState<OnboardingCircle>("starter");
  const [maxInputs, setMaxInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", { cache: "no-store" });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(data) ?? LOAD_FAILED);
      }
      const onboarding = readOnboarding(data);
      if (!onboarding) {
        throw new Error(LOAD_FAILED);
      }
      if (onboarding.completed && !replay) {
        router.replace("/today");
        return;
      }
      setState(onboarding);
      setProtein(String(onboarding.settings.rest_protein));
      setCircle(onboarding.circle);
      setMaxInputs(
        Object.fromEntries(
          onboarding.exercises.map((exercise) => [
            exercise.id,
            exercise.current_max
              ? formatWeight(exercise.current_max.max_weight)
              : "",
          ]),
        ),
      );
      setStep("food");
    } catch {
      setError(LOAD_FAILED);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [replay, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const proteinValue = parseDecimal(protein);
  const preview =
    proteinValue != null && proteinValue > 0 && state
      ? macroGoalsFromProtein(proteinValue, state.settings)
      : null;

  const steps = useMemo((): Step[] => {
    const next: Step[] = ["food"];
    if (!replay) {
      next.push("circle");
    }
    if (
      circle === "starter" &&
      state &&
      !state.maxesLocked &&
      state.exercises.length > 0
    ) {
      next.push("maxes");
    }
    return next;
  }, [circle, replay, state]);

  useEffect(() => {
    if (!steps.includes(step)) {
      setStep(steps.includes("circle") ? "circle" : (steps[0] ?? "food"));
    }
  }, [step, steps]);

  const stepIndex = Math.max(0, steps.indexOf(step));
  const isLast = step === steps[steps.length - 1];

  const goBack = useCallback(() => {
    const previous = steps[stepIndex - 1];
    if (previous) {
      setError(null);
      setStep(previous);
    }
  }, [stepIndex, steps]);

  function goNext() {
    if (step === "food") {
      if (proteinValue == null || proteinValue <= 0 || proteinValue > 400) {
        setError("Нужно число в граммах.");
        return;
      }
      setSkipFood(false);
      setError(null);
    }

    const following = steps[stepIndex + 1];
    if (following) {
      setStep(following);
      return;
    }

    void finish();
  }

  function skipFoodStep() {
    setError(null);
    setSkipFood(true);
    const following = steps[stepIndex + 1];
    if (following) {
      setStep(following);
      return;
    }
    void finish({ omitProtein: true });
  }

  async function finish(options?: { omitProtein?: boolean }) {
    const omitProtein = Boolean(options?.omitProtein || skipFood);
    if (!omitProtein) {
      if (proteinValue == null || proteinValue <= 0 || proteinValue > 400) {
        setError("Нужно число в граммах.");
        setStep("food");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const maxes = Object.entries(maxInputs).flatMap(([exerciseId, raw]) => {
        const maxWeight = parseDecimal(raw);
        if (maxWeight == null || maxWeight <= 0) {
          return [];
        }
        return [{ exerciseId, maxWeight }];
      });

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(omitProtein ? {} : { protein: proteinValue }),
          circle: replay ? "keep" : circle,
          maxes: state?.maxesLocked ? [] : maxes,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      const onboarding = readOnboarding(data);
      if (onboarding) {
        writeJson("/api/settings", { settings: onboarding.settings });
        writeJson("/api/onboarding", data);
      }

      router.replace("/today");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh flex-col justify-center px-4">
        <ScreenLoading />
      </main>
    );
  }

  if (!state) {
    return (
      <main className="flex min-h-dvh flex-col justify-center px-4">
        <ScreenError
          message={error ?? LOAD_FAILED}
          onRetry={() => void load()}
        />
      </main>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-44">
      {stepIndex > 0 ? <TelegramBackButton onBack={goBack} /> : null}
      <header className="flex items-center gap-2 px-4 py-4">
        {stepIndex > 0 ? (
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 motion-reduce:transition-none"
            aria-label="Назад"
            onClick={goBack}
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <StepDots steps={steps} current={step} />
          <h1
            key={step}
            className="mt-1 truncate text-2xl font-semibold tracking-tight animate-fade"
          >
            {titleForStep(step)}
          </h1>
        </div>
      </header>

      <div key={step} className="flex flex-col gap-4 px-4">
        {step === "food" ? (
          <FoodStep
            protein={protein}
            preview={preview}
            onProteinChange={(value) => {
              setError(null);
              setSkipFood(false);
              setProtein(value);
            }}
          />
        ) : null}

        {step === "circle" ? (
          <CircleStep value={circle} onChange={setCircle} />
        ) : null}

        {step === "maxes" ? (
          <MaxesStep
            exercises={state.exercises}
            values={maxInputs}
            onChange={(id, value) =>
              setMaxInputs((current) => ({ ...current, [id]: value }))
            }
          />
        ) : null}

        {error ? (
          <p className="animate-rise text-center text-base text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <StickyActions withNav={false}>
        {step === "food" ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            disabled={saving}
            onClick={() => skipFoodStep()}
          >
            Пока без еды
          </Button>
        ) : null}
        <Button
          className="h-14 w-full text-lg"
          disabled={saving}
          onClick={() => void goNext()}
        >
          {saving ? "Сохранение…" : isLast ? "Готово" : "Дальше"}
        </Button>
      </StickyActions>
    </div>
  );
}

function StepDots({ steps, current }: { steps: Step[]; current: Step }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {steps.map((id) => (
        <span
          key={id}
          className={cn(
            "h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
            id === current ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/35",
          )}
        />
      ))}
    </div>
  );
}

function FoodStep({
  protein,
  preview,
  onProteinChange,
}: {
  protein: string;
  preview: ReturnType<typeof macroGoalsFromProtein> | null;
  onProteinChange: (value: string) => void;
}) {
  const selected = parseDecimal(protein);

  return (
    <>
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Сколько белка в день. Не ведёшь еду — пропусти. Жиры и углеводы потом, в
        настройках.
      </p>
      <div
        className="animate-rise flex gap-2"
        style={{ animationDelay: "80ms" }}
      >
        {PROTEIN_PRESETS.map((value) => (
          <Button
            key={value}
            type="button"
            variant={selected === value ? "default" : "outline"}
            className="h-12 flex-1 text-base"
            onClick={() => onProteinChange(String(value))}
          >
            {value} г
          </Button>
        ))}
      </div>
      <div
        className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
        style={{ animationDelay: "120ms" }}
      >
        <Label htmlFor="onboarding-protein" className="text-base">
          Белок, г
        </Label>
        <Input
          id="onboarding-protein"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={protein}
          onChange={(event) => onProteinChange(event.target.value)}
          className="h-12 scroll-mb-36 text-base"
        />
        {preview ? (
          <p className="text-sm text-muted-foreground">
            Отдых {formatKcal(preview.rest.kcal)} ккал · тренировка{" "}
            {formatKcal(preview.training.kcal)} ккал
          </p>
        ) : null}
      </div>
    </>
  );
}

function CircleStep({
  value,
  onChange,
}: {
  value: OnboardingCircle;
  onChange: (value: OnboardingCircle) => void;
}) {
  return (
    <>
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Не по дням недели. Сегодня одно, завтра следующее.
      </p>
      <button
        type="button"
        aria-pressed={value === "starter"}
        className={cn(
          "card-surface animate-rise w-full px-5 py-4 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none",
          value === "starter" && "ring-2 ring-primary",
        )}
        style={{ animationDelay: "80ms" }}
        onClick={() => onChange("starter")}
      >
        <p className="text-lg font-medium">Ноги, жим, тяга</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Три тренировки по кругу.
        </p>
      </button>
      <button
        type="button"
        aria-pressed={value === "empty"}
        className={cn(
          "card-surface animate-rise w-full px-5 py-4 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none",
          value === "empty" && "ring-2 ring-primary",
        )}
        style={{ animationDelay: "120ms" }}
        onClick={() => onChange("empty")}
      >
        <p className="text-lg font-medium">Соберу сам</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Очередь выключу. Если зал не ведёшь — так и сделай.
        </p>
      </button>
    </>
  );
}

function MaxesStep({
  exercises,
  values,
  onChange,
}: {
  exercises: OnboardingState["exercises"];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <>
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Рабочий вес, от него считаются подходы. Не обязательно на раз. Пустое
        можно дописать в упражнениях.
      </p>
      <div
        className="card-surface animate-rise divide-y divide-border/70 px-5"
        style={{ animationDelay: "80ms" }}
      >
        {exercises.map((exercise) => (
          <div key={exercise.id} className="flex items-center gap-3 py-3">
            <Label
              htmlFor={`max-${exercise.id}`}
              className="min-w-0 flex-1 text-base font-medium"
            >
              {exercise.short_name ?? exercise.name}
            </Label>
            <Input
              id={`max-${exercise.id}`}
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="кг"
              value={values[exercise.id] ?? ""}
              onChange={(event) => onChange(exercise.id, event.target.value)}
              className="h-12 w-24 shrink-0 scroll-mb-36 text-base tabular-nums"
            />
          </div>
        ))}
      </div>
    </>
  );
}

function titleForStep(step: Step): string {
  if (step === "food") {
    return "Белок";
  }
  if (step === "circle") {
    return "Очередь";
  }
  return "Веса";
}

function readOnboarding(data: unknown): OnboardingState | null {
  return parseOnboardingState(data);
}
