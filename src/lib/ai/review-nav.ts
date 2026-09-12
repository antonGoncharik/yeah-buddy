export function reviewHref(from?: string | null): string {
  if (!from) {
    return "/progress";
  }
  return `/progress?from=${encodeURIComponent(from)}`;
}

export function reviewBackHref(from: string | null): string {
  switch (from) {
    case "food":
      return "/today/history";
    case "gym":
      return "/workouts/history";
    case "workouts":
      return "/workouts";
    case "today":
      return "/today";
    case "week":
      return "/today/week";
    default:
      return "/settings";
  }
}
