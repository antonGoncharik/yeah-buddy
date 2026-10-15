const KEY = "yeah-buddy-id-alias:";

export function rememberClientIdAliases(map: ReadonlyMap<string, string>): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  for (const [from, to] of map) {
    if (from !== to) {
      try {
        sessionStorage.setItem(`${KEY}${from}`, to);
      } catch {
        // private mode
      }
    }
  }
}

export function resolveClientIdAlias(id: string): string {
  if (typeof sessionStorage === "undefined") {
    return id;
  }
  try {
    const mapped = sessionStorage.getItem(`${KEY}${id}`);
    return mapped ?? id;
  } catch {
    return id;
  }
}
