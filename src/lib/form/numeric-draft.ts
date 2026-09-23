/** Keep only digits and at most one decimal separator while typing. */
export function sanitizeDecimalDraft(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (cleaned === "") {
    return "";
  }

  let separator: "." | "," | null = null;
  let whole = "";
  let fraction = "";
  for (const char of cleaned) {
    if (char === "." || char === ",") {
      if (separator != null) {
        continue;
      }
      separator = char;
      continue;
    }
    if (separator == null) {
      whole += char;
    } else {
      fraction += char;
    }
  }

  if (separator == null) {
    return whole;
  }
  return `${whole}${separator}${fraction}`;
}

/** Digits only — for stars, years, reps. */
export function sanitizeIntegerDraft(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function decimalDraftLooksValid(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return false;
  }
  return /^\d+([.,]\d+)?$/.test(trimmed);
}

export function integerDraftLooksValid(raw: string): boolean {
  return /^\d+$/.test(raw.trim());
}
