import { runAssistant } from "@/lib/ai/assistant/run";
import { assistantFoodSearchQuery } from "@/lib/ai/assistant/tools";
import { ReviewError } from "@/lib/ai/errors";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

export default (async () => {
  assertEqual(
    assistantFoodSearchQuery("Какая следующая тренировка?"),
    null,
    "workout question does not search foods",
  );
  assertEqual(
    assistantFoodSearchQuery("Что из творога добавить на ужин?"),
    "что творога добавить",
    "food question keeps three tokens",
  );
  assertEqual(
    assistantFoodSearchQuery("Сколько калорий в твороге?"),
    "сколько калорий твороге",
    "calorie question searches foods",
  );

  try {
    await runAssistant("user-1", "а");
    throw new Error("short question should fail");
  } catch (error) {
    assert(
      error instanceof ReviewError && error.code === "EMPTY",
      "short question is empty",
    );
  }

  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await runAssistant("user-1", "Сколько белка осталось?");
    throw new Error("missing key should fail");
  } catch (error) {
    assert(
      error instanceof ReviewError && error.code === "NO_KEY",
      "missing key does not spend a slot",
    );
  } finally {
    if (previous == null) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previous;
    }
  }

  console.log("assistant ok");
})();
