import {
  sanitizeUserNote,
  USER_INPUT_BEGIN,
  USER_INPUT_END,
  wrapUserInput,
} from "@/lib/ai/user-input";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(
  sanitizeUserNote("привет\nмир\t"),
  "привет мир",
  "note strips control chars",
);
assertEqual(
  wrapUserInput("овсянка 80 г"),
  `${USER_INPUT_BEGIN}\nовсянка 80 г\n${USER_INPUT_END}`,
  "wrap markers",
);
