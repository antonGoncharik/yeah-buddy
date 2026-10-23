"use client";

import { useMemo, useState } from "react";

import { EnergyGoalCard } from "@/components/day/energy-goal-card";
import { reportActionError } from "@/lib/action-error";
import type { ReviewBrief } from "@/lib/ai/types";
import { peekJson, postJson } from "@/lib/api-cache";
import { readMacroGoals } from "@/lib/day/today-payload";
import { LOAD_FAILED } from "@/lib/messages";
import {
  type EnergyGoalOffer,
  energyGoalHint,
  energyGoalOffer,
  energyGoalPayload,
} from "@/lib/nutrition/energy-goal";
import { goalForecastLine } from "@/lib/nutrition/goal-forecast";
import { isRecord } from "@/lib/read";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";

function reviewDaysToEnergy(days: ReviewBrief["nutrition"]["days"]) {
  return days.map((day) => ({
    date: day.date,
    fact_kcal: day.kcal,
    target_kcal: day.kcal_target,
    body_weight: day.weight,
  }));
}

export function WeeklyCheckCard({ brief }: { brief: ReviewBrief }) {
  const settings = readSettingsPayload(peekJson("/api/settings"));
  const [offer, setOffer] = useState<EnergyGoalOffer | null>(null);
  const [busy, setBusy] = useState(false);

  const computed = useMemo(() => {
    if (!settings?.goal) {
      return null;
    }
    const plan = energyGoalOffer({
      days: reviewDaysToEnergy(brief.nutrition.days),
      goal: settings.goal,
      sex: settings.sex,
      goal_pace: settings.goal_pace,
      height_cm: settings.height_cm,
      restProtein: settings.rest_protein,
      restFat: settings.rest_fat,
      restCarbs: settings.rest_carbs,
      trainingProtein: settings.training_protein,
      trainingFat: settings.training_fat,
      trainingCarbs: settings.training_carbs,
      dismissedKcal: settings.energy_goal_dismissed_kcal,
    });
    if (!plan) {
      return null;
    }
    return {
      offer: energyGoalPayload(plan),
      hint: energyGoalHint({
        days: reviewDaysToEnergy(brief.nutrition.days),
        goal: settings.goal,
        sex: settings.sex,
        restProtein: settings.rest_protein,
        restFat: settings.rest_fat,
        restCarbs: settings.rest_carbs,
        trainingProtein: settings.training_protein,
        trainingFat: settings.training_fat,
        dismissedKcal: settings.energy_goal_dismissed_kcal,
        accountAgeDays: null,
      }),
    };
  }, [brief.nutrition.days, settings]);

  const forecastLine =
    settings?.goal &&
    brief.nutrition.weight.end != null &&
    settings.goal !== "keep"
      ? goalForecastLine({
          weightKg: brief.nutrition.weight.end,
          goal: settings.goal,
          pace: settings.goal_pace,
        })
      : null;

  const activeOffer = offer ?? computed?.offer ?? null;

  async function apply() {
    if (busy) {
      return;
    }
    setBusy(true);
    haptic("commit");
    try {
      const data = await postJson("/api/settings/energy-goal", {
        action: "apply",
      });
      setOffer(null);
      if (isRecord(data) && isRecord(data.goals)) {
        readMacroGoals(data);
      }
      haptic("success");
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    if (busy || !activeOffer) {
      return;
    }
    setBusy(true);
    setOffer(null);
    haptic("tap");
    try {
      await postJson("/api/settings/energy-goal", {
        action: "dismiss",
        dismissedKcal: activeOffer.restKcal,
      });
      haptic("success");
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  if (!forecastLine && !activeOffer && !computed?.hint) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {forecastLine || computed?.hint ? (
        <section className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card px-4 py-4">
          {forecastLine ? (
            <p className="text-sm leading-snug">{forecastLine}</p>
          ) : null}
          {computed?.hint ? (
            <p className="text-sm leading-snug text-muted-foreground">
              {computed.hint}
            </p>
          ) : null}
        </section>
      ) : null}
      {activeOffer ? (
        <EnergyGoalCard
          offer={activeOffer}
          busy={busy}
          onApply={() => void apply()}
          onDismiss={() => void dismiss()}
        />
      ) : null}
    </div>
  );
}
