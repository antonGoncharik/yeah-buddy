import type { Dispatch, SetStateAction } from "react";

import {
  readSettings,
  type SettingsFormState,
} from "@/components/settings/settings-form-state";
import { patchJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";

type PatchableKey =
  | "reminders_enabled"
  | "gym_enabled"
  | "reminder_hour"
  | "timezone";

export async function patchSettingsField<K extends PatchableKey>(input: {
  form: SettingsFormState;
  key: K;
  value: SettingsFormState[K];
  setForm: Dispatch<SetStateAction<SettingsFormState | null>>;
  setError: (message: string | null) => void;
}): Promise<void> {
  if (input.form[input.key] === input.value) {
    return;
  }

  const previous = input.form[input.key];
  input.setForm({ ...input.form, [input.key]: input.value });
  input.setError(null);

  try {
    const data = await patchJson("/api/settings", {
      [input.key]: input.value,
    });
    const settings = readSettings(data);
    if (settings) {
      input.setForm((current) =>
        current ? { ...current, [input.key]: settings[input.key] } : current,
      );
      writeJson("/api/settings", data);
    }
  } catch (caught) {
    input.setForm((current) =>
      current ? { ...current, [input.key]: previous } : current,
    );
    input.setError(caught instanceof Error ? caught.message : LOAD_FAILED);
  }
}
