"use client";

import { ProteinCloseOffers } from "@/components/day/protein-close-offers";

/** FEAT-03: evening-style protein gap suggestions (≥25 g) from favorites and recent foods. */
export function MacroGapHint(props: {
  date: string;
  mealId: string | null;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
  remainingKcal: number;
  busy: boolean;
}) {
  return <ProteinCloseOffers {...props} macroGap />;
}
