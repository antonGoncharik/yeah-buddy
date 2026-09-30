import { forgetJson, mutateJson, peekJson, writeJson } from "@/lib/api-cache";
import { readMealTemplatesPayload } from "@/lib/meal/parse";
import { templatesUrl, writeCachedTemplate } from "@/lib/meal/template-cache";
import { isRecord } from "@/lib/read";

export function forgetMealsPackSettingsCache(): void {
  forgetJson("/api/settings");
  forgetJson("/api/meal-templates");
  forgetJson(templatesUrl("rest"));
  forgetJson(templatesUrl("training"));
}

/** After meals pack apply, settings screens must see new goals and templates. */
export async function refreshMealsPackSettingsCache(): Promise<void> {
  forgetMealsPackSettingsCache();
  const [settingsData, templatesData] = await Promise.all([
    mutateJson("/api/settings"),
    mutateJson("/api/meal-templates"),
  ]);
  writeJson("/api/settings", settingsData);
  writeJson("/api/meal-templates", templatesData);
  const templates = readMealTemplatesPayload(templatesData);
  if (!templates) {
    return;
  }
  for (const template of templates) {
    writeCachedTemplate(template.day_type, template);
  }
}

export function removePackFromListCache(token: string): void {
  const cached = peekJson("/api/packs");
  if (!isRecord(cached) || !Array.isArray(cached.packs)) {
    return;
  }

  writeJson("/api/packs", {
    packs: cached.packs.filter(
      (row) => !(isRecord(row) && row.token === token),
    ),
  });
}
