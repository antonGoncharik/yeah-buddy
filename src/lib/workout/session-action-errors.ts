import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

export function sessionLoadErrorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : LOAD_FAILED;
}

export function sessionFailAction(
  setError: (message: string) => void,
  caught: unknown,
): void {
  haptic("error");
  setError(sessionLoadErrorMessage(caught));
}
