import {
  eveningMacroGapLine,
  MACRO_GAP_PROTEIN_MIN,
  macroGapProteinOffers,
} from "@/lib/nutrition/macro-gap-hint";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(
  eveningMacroGapLine({ protein: 100, targetProtein: 160 }) != null,
  "large gap",
);
assert(
  eveningMacroGapLine({
    protein: 160 - MACRO_GAP_PROTEIN_MIN,
    targetProtein: 160,
  }) == null,
  "small gap",
);

const offers = macroGapProteinOffers(
  {
    remainingProtein: 40,
    remainingFat: 50,
    remainingCarbs: 100,
    remainingKcal: 800,
  },
  [
    {
      id: "1",
      name: "Творог",
      proteinPer100: 18,
      fatPer100: 0,
      carbsPer100: 3,
      kcalPer100: 90,
      portionGrams: 200,
      favorite: true,
      recentRank: 0,
    },
  ],
);
assert(offers.length > 0, "suggests food");

export default Promise.resolve();
