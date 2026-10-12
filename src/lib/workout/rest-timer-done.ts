import { playTimerStepHaptic } from "@/lib/telegram/haptic";

export function notifyRestTimerDone(): void {
  playTimerStepHaptic(0);
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate([180, 80, 180]);
  }
  if (
    typeof document === "undefined" ||
    document.visibilityState !== "hidden" ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }
  try {
    new Notification("Отдых закончился", {
      body: "Можно следующий подход.",
      tag: "yeah-buddy-rest",
    });
  } catch {
    // ignore
  }
}
