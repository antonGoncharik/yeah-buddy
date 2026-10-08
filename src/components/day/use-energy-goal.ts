"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";

import { reportActionError } from "@/lib/action-error";
import { peekJson, postJson, writeJson } from "@/lib/api-cache";
import {
  daysUrl,
  writeCachedEnergyGoal,
  writeDayResponse,
} from "@/lib/day/cache";
import type { MacroGoals } from "@/lib/day/today-payload";
import { readEnergyGoal, readMacroGoals } from "@/lib/day/today-payload";
import { LOAD_FAILED } from "@/lib/messages";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import { isRecord } from "@/lib/read";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";

function patchSettingsDismissedKcal(kcal: number): void {
  const url = "/api/settings";
  const current = peekJson(url);
  if (!isRecord(current)) {
    return;
  }
  const settings = readSettingsPayload(current);
  if (!settings) {
    return;
  }
  writeJson(url, {
    ...current,
    settings: { ...settings, energy_goal_dismissed_kcal: kcal },
  });
}

export function useEnergyGoal({
  date,
  setEnergyGoal,
  setGoals,
}: {
  date: string;
  setEnergyGoal: Dispatch<SetStateAction<EnergyGoalOffer | null>>;
  setGoals: Dispatch<SetStateAction<MacroGoals>>;
}) {
  const pending = useRef(false);
  const [energyGoalBusy, setEnergyGoalBusy] = useState(false);

  async function run(action: "apply" | "dismiss", dismissedKcal?: number) {
    if (pending.current) {
      return;
    }
    pending.current = true;
    setEnergyGoalBusy(true);
    haptic(action === "apply" ? "commit" : "tap");

    const previousOffer = action === "dismiss" ? peekJson(daysUrl(date)) : null;
    if (action === "dismiss") {
      setEnergyGoal(null);
      writeCachedEnergyGoal(date, null);
      if (dismissedKcal != null) {
        patchSettingsDismissedKcal(dismissedKcal);
      }
    }

    try {
      const data = await postJson("/api/settings/energy-goal", {
        action,
        ...(action === "dismiss" && dismissedKcal != null
          ? { dismissedKcal }
          : {}),
      });
      writeCachedEnergyGoal(date, null);
      setEnergyGoal(readEnergyGoal(data));
      if (isRecord(data) && isRecord(data.goals)) {
        setGoals(readMacroGoals(data));
      }
      if (action === "apply" && peekJson(daysUrl(date)) != null) {
        writeDayResponse(date, data);
      }
      haptic("success");
    } catch (caught) {
      haptic("error");
      if (action === "dismiss" && previousOffer != null) {
        writeJson(daysUrl(date), previousOffer);
        setEnergyGoal(readEnergyGoal(previousOffer));
      }
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      pending.current = false;
      setEnergyGoalBusy(false);
    }
  }

  return {
    energyGoalBusy,
    applyEnergyGoal: () => void run("apply"),
    dismissEnergyGoal: (dismissedKcal: number) =>
      void run("dismiss", dismissedKcal),
  };
}
