/** Screens where the user is starting a search/add/form flow. Window scroll is shared. */
const RESET_WINDOW_SCROLL = [
  /^\/today\/meals\/[^/]+\/(?:add|plate)(?:\/|$)/,
  /^\/settings\/meals\/[^/]+\/[^/]+\/add(?:\/|$)/,
  /^\/food\/new$/,
];

export function shouldResetWindowScroll(pathname: string): boolean {
  return RESET_WINDOW_SCROLL.some((pattern) => pattern.test(pathname));
}
