import type {
  MacroBudget,
  ProteinCloseCandidate,
} from "@/lib/nutrition/protein-close";
import { proteinCloseOffers } from "@/lib/nutrition/protein-close";

/** FEAT-03: suggest closing macros when evening protein gap is large. */
export const MACRO_GAP_PROTEIN_MIN = 25;

export function macroGapProteinOffers(
  budget: MacroBudget,
  foods: readonly ProteinCloseCandidate[],
) {
  return proteinCloseOffers(budget, foods, {
    minProteinGap: MACRO_GAP_PROTEIN_MIN,
  });
}

export function eveningMacroGapLine(input: {
  protein: number;
  targetProtein: number;
}): string | null {
  const gap = input.targetProtein - input.protein;
  if (!(gap > MACRO_GAP_PROTEIN_MIN)) {
    return null;
  }
  return `Осталось около ${Math.round(gap)} г белка — загляни в дневник.`;
}
