import { SettingsScreen } from "@/components/settings/settings-screen";
import {
  getGeminiDictateApiKey,
  getGeminiPlateApiKey,
  getGeminiTextApiKey,
} from "@/lib/ai/gemini";

export default function SettingsPage() {
  const mealChatHint = Boolean(
    getGeminiPlateApiKey() ||
      getGeminiDictateApiKey() ||
      getGeminiTextApiKey(),
  );

  return <SettingsScreen mealChatHint={mealChatHint} />;
}
