import { applyMealsPack } from "./pack-apply-meals";
import { applyWorkoutsPack } from "./pack-apply-workouts";
import { PackLimitError, PackNotFoundError } from "./pack-errors";
import { loadOwnedOrPublic } from "./pack-load";
import { getPackDetail, savePackCopy } from "./pack-publish";
import type { MealsPackPayload, WorkoutsPackPayload } from "./payload";
import type { SharePackDetail } from "./types";

export {
  PackEmptyError,
  PackLimitError,
  PackNotFoundError,
} from "./pack-errors";
export {
  getPackDetail,
  listOwnedPacks,
  publishLivePack,
  revokePack,
  savePackCopy,
} from "./pack-publish";

export async function applyPack(
  userId: string,
  token: string,
): Promise<SharePackDetail> {
  const pack = await loadOwnedOrPublic(userId, token);
  if (!pack) {
    throw new PackNotFoundError();
  }

  if (pack.kind === "meals") {
    await applyMealsPack(userId, pack.payload as MealsPackPayload);
  } else {
    await applyWorkoutsPack(userId, pack.payload as WorkoutsPackPayload);
  }

  if (pack.owner_user_id !== userId) {
    try {
      await savePackCopy(userId, pack.token);
    } catch (error) {
      if (!(error instanceof PackLimitError)) {
        throw error;
      }
    }
  }

  return getPackDetail(userId, pack.token);
}
