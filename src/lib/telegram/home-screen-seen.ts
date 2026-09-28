const HOME_SCREEN_TIP_DISMISSED_KEY = "yb.home_screen.tip.dismissed";

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function readHomeScreenTipDismissed(): boolean {
  return storage()?.getItem(HOME_SCREEN_TIP_DISMISSED_KEY) === "1";
}

export function dismissHomeScreenTip(): void {
  storage()?.setItem(HOME_SCREEN_TIP_DISMISSED_KEY, "1");
}
