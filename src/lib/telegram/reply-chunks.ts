const TELEGRAM_TEXT_LIMIT = 4000;

export function splitTelegramText(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }
  if (trimmed.length <= TELEGRAM_TEXT_LIMIT) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let rest = trimmed;
  while (rest.length > TELEGRAM_TEXT_LIMIT) {
    const window = rest.slice(0, TELEGRAM_TEXT_LIMIT);
    const paragraph = window.lastIndexOf("\n");
    const word = window.lastIndexOf(" ");
    const cut =
      paragraph > 200 ? paragraph : word > 200 ? word : TELEGRAM_TEXT_LIMIT;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest.length > 0) {
    chunks.push(rest);
  }
  return chunks;
}
