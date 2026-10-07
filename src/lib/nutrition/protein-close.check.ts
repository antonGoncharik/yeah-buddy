import {
  type MacroBudget,
  type ProteinCloseCandidate,
  proteinCloseOffers,
} from "@/lib/nutrition/protein-close";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function budget(
  remainingProtein: number,
  patch: Partial<Omit<MacroBudget, "remainingProtein">> = {},
): MacroBudget {
  return {
    remainingProtein,
    remainingFat: 200,
    remainingCarbs: 300,
    remainingKcal: 2500,
    ...patch,
  };
}

function food(
  patch: Partial<ProteinCloseCandidate> &
    Pick<ProteinCloseCandidate, "id" | "name">,
): ProteinCloseCandidate {
  return {
    proteinPer100: 18,
    fatPer100: 4,
    carbsPer100: 3,
    kcalPer100: 110,
    portionGrams: null,
    favorite: false,
    recentRank: 0,
    ...patch,
  };
}

const cottage = food({
  id: "cottage",
  name: "Творог",
  proteinPer100: 18,
  portionGrams: 200,
  favorite: true,
  recentRank: 1,
});
const whey = food({
  id: "whey",
  name: "Протеин",
  proteinPer100: 80,
  fatPer100: 4,
  carbsPer100: 6,
  kcalPer100: 380,
  portionGrams: 30,
  favorite: false,
  recentRank: 0,
});
const chicken = food({
  id: "chicken",
  name: "Курица",
  proteinPer100: 25,
  fatPer100: 2,
  carbsPer100: 0,
  kcalPer100: 120,
  portionGrams: null,
  favorite: false,
  recentRank: 2,
});

assertEqual(proteinCloseOffers(budget(5), [cottage]), [], "almost closed stays quiet");
assertEqual(proteinCloseOffers(budget(0), [cottage]), [], "closed stays quiet");
assertEqual(
  proteinCloseOffers(budget(40), [
    food({ id: "oil", name: "Масло", proteinPer100: 0, recentRank: 0 }),
  ]),
  [],
  "fat without protein is skipped",
);
assertEqual(
  proteinCloseOffers(budget(40), [
    food({
      id: "bread",
      name: "Хлеб",
      proteinPer100: 8,
      portionGrams: null,
      recentRank: 0,
    }),
  ]),
  [],
  "a huge portion is not a close",
);

const usual = proteinCloseOffers(budget(40), [cottage]);
assertEqual(usual[0]?.grams, 200, "usual cottage portion");
assertEqual(usual[0]?.protein, 36, "cottage protein");

const scoop = proteinCloseOffers(budget(40), [whey]);
assertEqual(scoop[0]?.grams, 30, "usual whey scoop");
assertEqual(scoop[0]?.protein, 24, "whey protein");

const weighed = proteinCloseOffers(budget(40), [chicken]);
assertEqual(weighed[0]?.grams, 160, "grams that close the gap");
assertEqual(weighed[0]?.protein, 40, "chicken closes 40 g");

const ranked = proteinCloseOffers(budget(40), [chicken, cottage, whey]);
assertEqual(
  ranked.map((row) => row.foodId),
  ["cottage", "chicken", "whey"],
  "closing the gap outranks a small scoop",
);

const extra = food({
  id: "eggs",
  name: "Яйца",
  proteinPer100: 13,
  portionGrams: 150,
  recentRank: 3,
});
assertEqual(
  proteinCloseOffers(budget(40), [cottage, whey, chicken, extra]).length,
  3,
  "three buttons",
);

assertEqual(
  proteinCloseOffers(budget(40), [
    food({
      id: "catalog",
      name: "Рис",
      proteinPer100: 7,
      favorite: false,
      recentRank: null,
    }),
    cottage,
  ]).map((row) => row.foodId),
  ["cottage"],
  "untouched catalog food stays out",
);

assertEqual(
  proteinCloseOffers(budget(40), [
    food({
      id: "dup-a",
      name: "Творог",
      portionGrams: 100,
      favorite: false,
      recentRank: 4,
    }),
    cottage,
  ]).map((row) => row.foodId),
  ["cottage"],
  "same name keeps the better portion",
);

const nuts = food({
  id: "nuts",
  name: "Орехи",
  proteinPer100: 15,
  fatPer100: 65,
  carbsPer100: 10,
  kcalPer100: 700,
  portionGrams: 200,
  favorite: true,
  recentRank: 0,
});
assertEqual(
  proteinCloseOffers(
    budget(40, { remainingFat: 15, remainingCarbs: 80, remainingKcal: 250 }),
    [nuts],
  ),
  [],
  "fatty snack is not offered past fat and kcal headroom",
);

const leanClose = proteinCloseOffers(
  budget(40, { remainingFat: 15, remainingCarbs: 80, remainingKcal: 250 }),
  [chicken],
);
assertEqual(leanClose[0]?.grams, 160, "lean protein still closes when fat is tight");

console.log("protein close ok");
