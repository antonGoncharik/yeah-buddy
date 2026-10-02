import {
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

function food(
  patch: Partial<ProteinCloseCandidate> &
    Pick<ProteinCloseCandidate, "id" | "name">,
): ProteinCloseCandidate {
  return {
    proteinPer100: 18,
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
  portionGrams: 30,
  favorite: false,
  recentRank: 0,
});
const chicken = food({
  id: "chicken",
  name: "Курица",
  proteinPer100: 25,
  portionGrams: null,
  favorite: false,
  recentRank: 2,
});

assertEqual(proteinCloseOffers(5, [cottage]), [], "almost closed stays quiet");
assertEqual(proteinCloseOffers(0, [cottage]), [], "closed stays quiet");
assertEqual(
  proteinCloseOffers(40, [
    food({ id: "oil", name: "Масло", proteinPer100: 0, recentRank: 0 }),
  ]),
  [],
  "fat without protein is skipped",
);
assertEqual(
  proteinCloseOffers(40, [
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

const usual = proteinCloseOffers(40, [cottage]);
assertEqual(usual[0]?.grams, 200, "usual cottage portion");
assertEqual(usual[0]?.protein, 36, "cottage protein");

const scoop = proteinCloseOffers(40, [whey]);
assertEqual(scoop[0]?.grams, 30, "usual whey scoop");
assertEqual(scoop[0]?.protein, 24, "whey protein");

const weighed = proteinCloseOffers(40, [chicken]);
assertEqual(weighed[0]?.grams, 160, "grams that close the gap");
assertEqual(weighed[0]?.protein, 40, "chicken closes 40 g");

const ranked = proteinCloseOffers(40, [chicken, cottage, whey]);
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
  proteinCloseOffers(40, [cottage, whey, chicken, extra]).length,
  3,
  "three buttons",
);

assertEqual(
  proteinCloseOffers(40, [
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
  proteinCloseOffers(40, [
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

console.log("protein close ok");
