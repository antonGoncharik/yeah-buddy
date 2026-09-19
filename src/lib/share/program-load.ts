import {
  type FeaturedProgramDetail,
  featuredProgramPreset,
  featuredProgramView,
  isFeaturedProgramId,
} from "@/lib/share/program-start";
import { getProgramShareUrl } from "@/lib/telegram/bot";
import { matchProgramPresetId } from "@/lib/workout/program-presets";
import { listTemplates } from "@/lib/workout/templates";

export class FeaturedProgramNotFoundError extends Error {
  constructor() {
    super("Нет такой программы.");
    this.name = "FeaturedProgramNotFoundError";
  }
}

export async function loadFeaturedProgramDetail(
  userId: string,
  id: string,
): Promise<FeaturedProgramDetail> {
  if (!isFeaturedProgramId(id)) {
    throw new FeaturedProgramNotFoundError();
  }

  const templates = await listTemplates(userId);
  return featuredProgramView(featuredProgramPreset(id), {
    share_url: await getProgramShareUrl(id),
    applied: matchProgramPresetId(templates) === id,
  });
}
