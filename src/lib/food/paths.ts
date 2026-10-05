/** Append a path segment before an optional `?query` suffix. */
export function appendFoodHrefSegment(href: string, segment: string): string {
  const queryAt = href.indexOf("?");
  if (queryAt < 0) {
    return `${href}/${segment}`;
  }
  return `${href.slice(0, queryAt)}/${segment}${href.slice(queryAt)}`;
}
