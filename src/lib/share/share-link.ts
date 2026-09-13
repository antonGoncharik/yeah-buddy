export interface WebShareFields {
  title: string;
  text: string;
  url: string;
}

export function isShareAbort(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export function clipboardShareText(url: string, text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") {
    return url;
  }
  if (trimmed.includes(url)) {
    return trimmed;
  }
  return `${trimmed}\n${url}`;
}

export function shouldUseWebShare(
  userAgent: string,
  canShare: boolean,
): boolean {
  if (!canShare) {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function webShareFields(input: {
  title: string;
  text: string;
  url: string;
}): WebShareFields {
  return {
    title: input.title,
    text: input.text,
    url: input.url,
  };
}
