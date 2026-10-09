import type { MuscleBodyView, MuscleId } from "@/lib/types";

export const MUSCLE_IDS: MuscleId[] = [
  "chest",
  "front_delts",
  "side_delts",
  "biceps",
  "forearms",
  "abs",
  "quads",
  "calves",
  "upper_back",
  "rear_delts",
  "lats",
  "triceps",
  "lower_back",
  "glutes",
  "hamstrings",
];

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  chest: "Грудь",
  lats: "Широчайшие",
  upper_back: "Верх спины",
  lower_back: "Поясница",
  abs: "Пресс",
  front_delts: "Передняя дельта",
  side_delts: "Средняя дельта",
  rear_delts: "Задняя дельта",
  biceps: "Бицепс",
  triceps: "Трицепс",
  forearms: "Предплечья",
  quads: "Квадрицепс",
  hamstrings: "Бицепс бедра",
  glutes: "Ягодицы",
  calves: "Икры",
};

export const MUSCLE_VIEW: Record<MuscleId, MuscleBodyView> = {
  chest: "front",
  front_delts: "front",
  side_delts: "front",
  biceps: "front",
  forearms: "front",
  abs: "front",
  quads: "front",
  calves: "front",
  upper_back: "back",
  rear_delts: "back",
  lats: "back",
  triceps: "back",
  lower_back: "back",
  glutes: "back",
  hamstrings: "back",
};

export type MuscleWeights = Partial<Record<MuscleId, number>>;

export function normalizeMuscleWeights(
  weights: MuscleWeights,
): Partial<Record<MuscleId, number>> {
  let sum = 0;
  for (const value of Object.values(weights)) {
    if (value != null && value > 0) {
      sum += value;
    }
  }
  if (sum <= 0) {
    return {};
  }
  const out: Partial<Record<MuscleId, number>> = {};
  for (const [key, value] of Object.entries(weights) as Array<
    [MuscleId, number | undefined]
  >) {
    if (value != null && value > 0) {
      out[key] = value / sum;
    }
  }
  return out;
}

function foldMuscleText(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/** Avoid «t bar» inside «squat barbell» and similar glued matches. */
function includesToken(haystack: string, token: string): boolean {
  const parts = haystack.split(/\s+/).filter((part) => part.length > 0);
  return parts.includes(token);
}

export function resolveExerciseMuscles(input: {
  body_part: string | null;
  name_en: string | null;
  name_ru: string | null;
  equipment: string | null;
}): Partial<Record<MuscleId, number>> {
  const name = foldMuscleText(
    `${input.name_ru ?? ""} ${input.name_en ?? ""} ${input.equipment ?? ""}`,
  );
  const part = foldMuscleText(input.body_part ?? "");

  if (part === "cardio" || part === "neck") {
    return {};
  }

  const fromPart = bodyPartWeights(part);
  const refined = refineByName(name, part, fromPart);
  return normalizeMuscleWeights(refined);
}

function bodyPartWeights(part: string): MuscleWeights {
  switch (part) {
    case "chest":
      return { chest: 1, triceps: 0.35 };
    case "back":
      return { lats: 0.55, upper_back: 0.35, lower_back: 0.15 };
    case "shoulders":
      return { front_delts: 0.35, side_delts: 0.45, rear_delts: 0.2 };
    case "upper arms":
      return { biceps: 0.5, triceps: 0.5 };
    case "lower arms":
      return { forearms: 1 };
    case "upper legs":
      return { quads: 0.4, glutes: 0.35, hamstrings: 0.25 };
    case "lower legs":
      return { calves: 1 };
    case "waist":
      return { abs: 0.7, lower_back: 0.3 };
    default:
      return {};
  }
}

function refineByName(
  name: string,
  part: string,
  base: MuscleWeights,
): MuscleWeights {
  if (
    includesAny(name, ["трицеп", "triceps", "разгиб", "extension", "франц"])
  ) {
    return { triceps: 1, chest: 0.15 };
  }
  if (
    includesAny(name, [
      "бицеп",
      "bicep",
      "curl",
      "сгибание рук",
      "молот",
      "скотт",
    ])
  ) {
    return { biceps: 1, forearms: 0.2 };
  }
  if (
    includesAny(name, [
      "подтяг",
      "pull up",
      "pull-up",
      "chin",
      "верхн",
      "lat pulldown",
      "pulldown",
    ])
  ) {
    return { lats: 0.75, biceps: 0.25, upper_back: 0.2 };
  }
  if (
    includesAny(name, [
      "тяга",
      "гребл",
      "махи в наклоне",
      "face pull",
      "задн",
      "rear delt",
    ]) ||
    includesToken(name, "row") ||
    includesAny(name, ["т-штанга", "t-bar", "t bar row", "landmine row"])
  ) {
    return { lats: 0.35, upper_back: 0.35, rear_delts: 0.35, biceps: 0.15 };
  }
  if (includesAny(name, ["шраг", "shrug"])) {
    return { upper_back: 1 };
  }
  if (
    includesAny(name, ["гипер", "hyper", "good morning", "наклон со штанг"])
  ) {
    return { lower_back: 0.55, hamstrings: 0.45, glutes: 0.2 };
  }
  if (includesAny(name, ["станов", "deadlift", "dead lift", "румын", "rdl"])) {
    return {
      hamstrings: 0.45,
      glutes: 0.35,
      lower_back: 0.35,
      upper_back: 0.15,
    };
  }
  if (
    includesAny(name, [
      "присед",
      "squat",
      "жим ног",
      "leg press",
      "разгибание ног",
      "leg extension",
      "выпад",
      "lunge",
      "гак",
      "hack",
    ])
  ) {
    return { quads: 0.55, glutes: 0.4, hamstrings: 0.1 };
  }
  if (
    includesAny(name, ["сгибание ног", "leg curl", "болгар", "split squat"])
  ) {
    return { hamstrings: 0.55, glutes: 0.35, quads: 0.15 };
  }
  if (includesAny(name, ["ягод", "glute", "hip thrust", "мост"])) {
    return { glutes: 1, hamstrings: 0.25 };
  }
  if (includesAny(name, ["икр", "calf", "носк"])) {
    return { calves: 1 };
  }
  if (
    includesAny(name, ["скруч", "crunch", "пресс", "планк", "plank", "abs"])
  ) {
    return { abs: 1 };
  }
  if (
    includesAny(name, [
      "разведение",
      "lateral raise",
      "в стороны",
      "side raise",
    ])
  ) {
    return { side_delts: 1, upper_back: 0.1 };
  }
  if (includesAny(name, ["перед собой", "front raise"])) {
    return { front_delts: 1 };
  }
  if (
    includesAny(name, [
      "жим",
      "press",
      "отжим",
      "push up",
      "push-up",
      "dip",
      "брусь",
    ])
  ) {
    if (
      part === "shoulders" ||
      includesAny(name, ["стоя", "overhead", "армей"])
    ) {
      return {
        front_delts: 0.45,
        side_delts: 0.35,
        triceps: 0.35,
        upper_back: 0.1,
      };
    }
    return { chest: 0.65, triceps: 0.35, front_delts: 0.2 };
  }
  if (includesAny(name, ["пуловер", "pullover", "сведен", "fly", "кросс"])) {
    return { chest: 0.55, lats: 0.25, front_delts: 0.15 };
  }

  if (Object.keys(base).length > 0) {
    return base;
  }

  if (part === "chest") {
    return { chest: 1, triceps: 0.3 };
  }
  if (part === "back") {
    return { lats: 0.5, upper_back: 0.4 };
  }

  return base;
}
