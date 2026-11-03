import { parseBodyWeight } from "@/lib/day/body-weight";

export type WeightReply =
  | { kind: "ignore" }
  | { kind: "ask" }
  | { kind: "save"; kg: number };

/** A private-chat message that is only a number. Food lines stay ignored. */
export function parseWeightReply(text: string): WeightReply {
  const trimmed = text.trim();
  if (!/^\d{1,3}(?:[.,]\d)?$/.test(trimmed)) {
    return { kind: "ignore" };
  }

  const kg = parseBodyWeight(Number(trimmed.replace(",", ".")));
  if (kg == null) {
    return { kind: "ask" };
  }

  return { kind: "save", kg };
}
