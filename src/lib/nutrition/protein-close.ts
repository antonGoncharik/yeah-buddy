export interface ProteinCloseCandidate {
  id: string;
  name: string;
  proteinPer100: number;
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
  remainingProtein: number,
  foods: readonly ProteinCloseCandidate[],
): ProteinCloseOffer[] {
  if (!(remainingProtein >= MIN_GAP)) {
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
    const built = offerFor(food, remainingProtein);
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
  remaining: number,
): (ProteinCloseOffer & { score: number }) | null {
  const name = food.name.trim();
  if (name === "" || !(food.proteinPer100 >= MIN_DENSITY)) {
    return null;
  }

  const perGram = food.proteinPer100 / 100;
  const grams = chooseGrams(food.portionGrams, perGram, remaining);
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
  portion: number | null,
  perGram: number,
  remaining: number,
): number | null {
  if (portion != null && portion >= 10 && portion <= MAX_GRAMS) {
    const portionProtein = portion * perGram;
    const useful =
      portionProtein >= remaining * 0.55 && portionProtein <= remaining * 1.4;
    const bite = portionProtein >= 12 && portionProtein <= remaining * 1.5;
    if (useful || bite) {
      return roundPortion(portion);
    }
  }

  const grams = roundPortion(remaining / perGram);
  if (grams < 20 || grams > MAX_GRAMS) {
    return null;
  }
  return grams;
}

function roundPortion(grams: number): number {
  if (!Number.isFinite(grams) || grams <= 0) {
    return 0;
  }
  return Math.max(10, Math.round(grams / 10) * 10);
}
