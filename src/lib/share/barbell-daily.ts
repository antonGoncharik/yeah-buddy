import { formatWeight } from "@/lib/workout/numbers";
import { plateLabel } from "@/lib/workout/rest-load";

export const BARBELL_INLINE_PREFIX = "barbell";
export const BARBELL_GAME_HREF = "/workouts/barbell";
export const BARBELL_GAME_TITLE = "Собери штангу";
export const BARBELL_GAME_HINT = "Задача дня · блины на гриф";
export const BARBELL_SHARE_TO_CHAT = "В чат";
export const BARBELL_SHARE_STORY = "Сторис";

export interface BarbellShareFacts {
  targetKg: number;
  moves: number;
  dayKey?: string | null;
}

export function barbellShareCaption(facts: BarbellShareFacts): string {
  const target = plateLabel(facts.targetKg);
  const moves = String(facts.moves);
  return [
    `Собрал ${target} кг за ${moves} ${plateWord(facts.moves)}`,
    "Задача дня · Yeah Buddy",
  ].join("\n");
}

export function barbellShareTitle(facts: BarbellShareFacts): string {
  return `${plateLabel(facts.targetKg)} кг · ${facts.moves} ${plateWord(facts.moves)}`;
}

export function barbellInlineQuery(facts: BarbellShareFacts): string {
  const parts = [
    BARBELL_INLINE_PREFIX,
    facts.dayKey ?? "-",
    formatShareKg(facts.targetKg),
    String(facts.moves),
  ];
  return parts.join(" ");
}

export function parseBarbellInlineQuery(
  query: string,
): BarbellShareFacts | null {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if ((tokens[0] ?? "").toLowerCase() !== BARBELL_INLINE_PREFIX) {
    return null;
  }

  let dayKey: string | null = null;
  let targetToken = tokens[1];
  let movesToken = tokens[2];

  if (targetToken?.includes("-")) {
    dayKey = targetToken;
    targetToken = tokens[2];
    movesToken = tokens[3];
  }

  const targetKg = Number(targetToken?.replace(",", "."));
  const moves = Number(movesToken);
  if (!Number.isFinite(targetKg) || targetKg < 20 || targetKg > 500) {
    return null;
  }
  if (!Number.isFinite(moves) || moves < 1 || moves > 40) {
    return null;
  }

  return { targetKg, moves, dayKey };
}

export function matchBarbellInlineSearch(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") {
    return false;
  }
  if (normalized.startsWith(BARBELL_INLINE_PREFIX)) {
    return true;
  }
  const aliases = ["собери", "штанг", "блин", "гриф", "barbell", "plates"];
  return aliases.some((part) => normalized.includes(part));
}

export function barbellTeaserCaption(): string {
  return "Собери штангу — задача дня в Yeah Buddy.\nБлины на гриф, без зала.";
}

function plateWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "блин";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "блина";
  }
  return "блинов";
}

function formatShareKg(kg: number): string {
  return formatWeight(kg).replace(",", ".");
}
