export interface MacroBudget {
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
  remainingKcal: number;
}

export interface ProteinCloseCandidate {
  id: string;
  name: string;
  proteinPer100: number;
  fatPer100: number;
  carbsPer100: number;
  kcalPer100: number;
  portionGrams: number | null;
  favorite: boolean;
  /** 0 is the food logged most recently. Null if it is only a favorite. */
  recentRank: number | null;
}

export interface ProteinCloseOffer {
  foodId: string;
  name: string;
  grams: number;
  protein: number;
}

const MIN_GAP = 8;
const MIN_DENSITY = 8;
const MIN_PROTEIN = 8;
const MAX_GRAMS = 400;
const MAX_OFFERS = 3;

export function proteinCloseOffers(
  budget: MacroBudget,
  foods: readonly ProteinCloseCandidate[],
): ProteinCloseOffer[] {
  if (!(budget.remainingProtein >= MIN_GAP)) {
    return [];
  }

  const ranked: Array<ProteinCloseOffer & { score: number }> = [];
  const seenIds = new Set<string>();

  for (const food of foods) {
    if (seenIds.has(food.id)) {
      continue;
    }
    if (!food.favorite && food.recentRank == null) {
      continue;
    }
    const built = offerFor(food, budget);
    if (!built) {
      continue;
    }
    seenIds.add(food.id);
    ranked.push(built);
  }

  ranked.sort(
    (left, right) =>
      right.score - left.score || left.name.localeCompare(right.name, "ru"),
  );

  const seenNames = new Set<string>();
  const offers: ProteinCloseOffer[] = [];
  for (const row of ranked) {
    const key = row.name.toLocaleLowerCase("ru");
    if (seenNames.has(key)) {
      continue;
    }
    seenNames.add(key);
    offers.push({
      foodId: row.foodId,
      name: row.name,
      grams: row.grams,
      protein: row.protein,
    });
    if (offers.length >= MAX_OFFERS) {
      break;
    }
  }
  return offers;
}

function offerFor(
  food: ProteinCloseCandidate,
  budget: MacroBudget,
): (ProteinCloseOffer & { score: number }) | null {
  const name = food.name.trim();
  if (name === "" || !(food.proteinPer100 >= MIN_DENSITY)) {
    return null;
  }

  const remaining = budget.remainingProtein;
  const perGram = food.proteinPer100 / 100;
  const grams = chooseGrams(food, food.portionGrams, perGram, remaining, budget);
  if (grams == null) {
    return null;
  }

  const protein = Math.round(grams * perGram * 10) / 10;
  if (protein < MIN_PROTEIN) {
    return null;
  }

  const coverage = protein / remaining;
  if (coverage < 0.35 && protein < 15) {
    return null;
  }

  let score = 30;
  if (coverage >= 0.8 && coverage <= 1.35) {
    score = 100;
  } else if (coverage >= 0.5) {
    score = 60;
  }
  if (food.favorite) {
    score += 15;
  }
  if (food.recentRank != null) {
    score += Math.max(0, 20 - food.recentRank);
  }
  score += Math.min(food.proteinPer100, 40) / 10;

  return {
    foodId: food.id,
    name,
    grams,
    protein,
    score,
  };
}

function chooseGrams(
  food: ProteinCloseCandidate,
  portion: number | null,
  perGram: number,
  remaining: number,
  budget: MacroBudget,
): number | null {
  const cap = maxGramsWithinBudget(food, budget);

  if (portion != null && portion >= 10 && portion <= MAX_GRAMS) {
    const cappedPortion = Math.min(portion, cap);
    const portionProtein = cappedPortion * perGram;
    const useful =
      portionProtein >= remaining * 0.55 && portionProtein <= remaining * 1.4;
    const bite = portionProtein >= 12 && portionProtein <= remaining * 1.5;
    if (useful || bite) {
      return finalizeGrams(cappedPortion);
    }
  }

  const ideal = roundPortion(remaining / perGram);
  if (ideal > MAX_GRAMS) {
    return null;
  }
  const grams = finalizeGrams(Math.min(ideal, cap));
  if (grams == null || grams < 20) {
    return null;
  }
  return grams;
}

function maxGramsWithinBudget(
  food: Pick<
    ProteinCloseCandidate,
    "fatPer100" | "carbsPer100" | "kcalPer100"
  >,
  budget: MacroBudget,
): number {
  const caps = [
    gramCapFromNutrient(budget.remainingFat, food.fatPer100),
    gramCapFromNutrient(budget.remainingCarbs, food.carbsPer100),
    gramCapFromNutrient(budget.remainingKcal, food.kcalPer100),
  ];
  return Math.min(MAX_GRAMS, ...caps);
}

function gramCapFromNutrient(remaining: number, per100: number): number {
  if (!(per100 > 0)) {
    return MAX_GRAMS;
  }
  if (remaining <= 0) {
    return 0;
  }
  return (remaining / per100) * 100;
}

function finalizeGrams(grams: number): number | null {
  const rounded = roundPortion(grams);
  if (rounded <= 0 || rounded > MAX_GRAMS) {
    return null;
  }
  return rounded;
}

function roundPortion(grams: number): number {
  if (!Number.isFinite(grams) || grams <= 0) {
    return 0;
  }
  return Math.max(10, Math.round(grams / 10) * 10);
}
