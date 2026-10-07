"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";

import { reportActionError } from "@/lib/action-error";
import { peekJson, postJson } from "@/lib/api-cache";
import { daysUrl, writeDayResponse } from "@/lib/day/cache";
import type { MacroGoals } from "@/lib/day/today-payload";
import { readEnergyGoal, readMacroGoals } from "@/lib/day/today-payload";
import { LOAD_FAILED } from "@/lib/messages";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";

export function useEnergyGoal({
  date,
  setBusy,
  setEnergyGoal,
  setGoals,
}: {
  date: string;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setEnergyGoal: Dispatch<SetStateAction<EnergyGoalOffer | null>>;
  setGoals: Dispatch<SetStateAction<MacroGoals>>;
}) {
  const pending = useRef(false);

  async function run(action: "apply" | "dismiss") {
    if (pending.current) {
      return;
    }
    pending.current = true;
    setBusy(true);
    haptic(action === "apply" ? "commit" : "tap");
    try {
      const data = await postJson("/api/settings/energy-goal", { action });
      if (peekJson(daysUrl(date)) != null) {
        writeDayResponse(date, data);
      }
      setEnergyGoal(readEnergyGoal(data));
      if (isRecord(data) && isRecord(data.goals)) {
        setGoals(readMacroGoals(data));
      }
      haptic("success");
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return {
    applyEnergyGoal: () => void run("apply"),
    dismissEnergyGoal: () => void run("dismiss"),
  };
}
