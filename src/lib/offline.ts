const NETWORK_MESSAGE =
  /failed to fetch|networkerror|network request failed|load failed|fetch failed/i;

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.name === "ApiError") {
    return false;
  }
  if (error instanceof TypeError) {
    return true;
  }
  return NETWORK_MESSAGE.test(error.message);
}

export function hasLocalDiary(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("yb.v1:")) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}
