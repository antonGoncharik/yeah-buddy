export const HOME_SCREEN_API = "8.0";

export type HomeScreenStatus =
  | "unsupported"
  | "unknown"
  | "added"
  | "missed";

export const HOME_SCREEN_LABEL = "На рабочий стол";
export const HOME_SCREEN_TIP_TITLE = "Ярлык на главный экран";
export const HOME_SCREEN_TIP_BODY =
  "Многие не знают: мини-приложение можно вынести на рабочий стол телефона — как обычную иконку. Дневник откроется сразу, без поиска бота в чатах. Нажми «На рабочий стол» ниже — Telegram сам подскажет, куда добавить.";
export const HOME_SCREEN_HINT_MISSED =
  "Иконка на главном экране — дневник в один тап, без бота в списке чатов";
export const HOME_SCREEN_HINT_ADDED =
  "Ярлык уже есть — открывай дневник с главного экрана";
type HomeScreenHost = {
  isVersionAtLeast?: (version: string) => boolean;
  checkHomeScreenStatus?: (
    callback?: (status: HomeScreenStatus) => void,
  ) => void;
  addToHomeScreen?: () => void;
  onEvent?: (eventType: string, handler: () => void) => void;
  offEvent?: (eventType: string, handler: () => void) => void;
};

export function isHomeScreenApiAvailable(webApp: HomeScreenHost): boolean {
  if (typeof webApp.addToHomeScreen !== "function") {
    return false;
  }
  if (typeof webApp.checkHomeScreenStatus !== "function") {
    return false;
  }
  if (typeof webApp.isVersionAtLeast === "function") {
    return webApp.isVersionAtLeast(HOME_SCREEN_API);
  }
  return true;
}

export async function readHomeScreenStatus(): Promise<HomeScreenStatus> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as HomeScreenHost;
    if (!isHomeScreenApiAvailable(webApp)) {
      return "unsupported";
    }

    return await new Promise<HomeScreenStatus>((resolve) => {
      const timer = window.setTimeout(() => {
        resolve("unknown");
      }, 4_000);

      webApp.checkHomeScreenStatus?.((status) => {
        window.clearTimeout(timer);
        resolve(status);
      });
    });
  } catch {
    return "unsupported";
  }
}

export async function promptAddToHomeScreen(): Promise<
  "prompted" | "unavailable"
> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as HomeScreenHost;
    if (!isHomeScreenApiAvailable(webApp)) {
      return "unavailable";
    }

    webApp.addToHomeScreen?.();
    return "prompted";
  } catch {
    return "unavailable";
  }
}

export async function bindHomeScreenAdded(
  onAdded: () => void,
): Promise<(() => void) | null> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as HomeScreenHost;
    if (!isHomeScreenApiAvailable(webApp)) {
      return null;
    }
    if (typeof webApp.onEvent !== "function") {
      return null;
    }

    const handler = () => {
      onAdded();
    };
    webApp.onEvent("homeScreenAdded", handler);
    return () => {
      webApp.offEvent?.("homeScreenAdded", handler);
    };
  } catch {
    return null;
  }
}

export function homeScreenHint(status: HomeScreenStatus): string {
  if (status === "added") {
    return HOME_SCREEN_HINT_ADDED;
  }
  return HOME_SCREEN_HINT_MISSED;
}
