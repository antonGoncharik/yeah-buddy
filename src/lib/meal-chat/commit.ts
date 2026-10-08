import { toCommitItem } from "@/components/day/plate-draft-commit";
import { commitPlateItems, plateCommitSchema } from "@/lib/ai/plate-commit";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import type { MealItem } from "@/lib/types";

export function plateDraftReadyToCommit(
  items: PlateDraftItem[],
): PlateDraftItem[] | null {
  const mapped = items.map((item) => toCommitItem(item));
  const parsed = plateCommitSchema.safeParse({ items: mapped });
  if (!parsed.success) {
    return null;
  }
  return items;
}

export async function commitPlateDraft(
  userId: string,
  mealId: string,
  items: PlateDraftItem[],
): Promise<MealItem[] | null> {
  const ready = plateDraftReadyToCommit(items);
  if (!ready) {
    return null;
  }

  const mapped = ready.map((item) => toCommitItem(item));
  const parsed = plateCommitSchema.parse({ items: mapped });
  return commitPlateItems(userId, mealId, parsed);
}
