import { LOAD_FAILED, WORKOUT_TEMPLATE_EMPTY } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

export function hubLoadErrorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : LOAD_FAILED;
}

export function hubWarnEmptyTemplate(
  setError: (message: string) => void,
): void {
  haptic("warn");
  setError(WORKOUT_TEMPLATE_EMPTY);
}

export function hubFailAction(
  setError: (message: string) => void,
  caught: unknown,
): void {
  haptic("error");
  setError(hubLoadErrorMessage(caught));
}
