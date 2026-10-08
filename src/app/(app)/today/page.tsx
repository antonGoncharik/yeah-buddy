import { TodayScreen } from "@/components/day/today-screen";
import { getGeminiDictateApiKey, getGeminiPlateApiKey } from "@/lib/ai/gemini";

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : undefined;
  const readOnly = params.view === "history";
  const fromSettings = params.from === "settings";
  const aiCapture = Boolean(
    getGeminiPlateApiKey() || getGeminiDictateApiKey(),
  );

  return (
    <TodayScreen
      initialDate={date}
      readOnly={readOnly}
      fromSettings={fromSettings}
      aiCapture={aiCapture}
    />
  );
}
