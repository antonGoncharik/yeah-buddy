import {
  decimalDraftLooksValid,
  integerDraftLooksValid,
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
} from "@/lib/form/numeric-draft";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(sanitizeDecimalDraft("12a3"), "123", "strip letters");
assertEqual(sanitizeDecimalDraft("80 кг"), "80", "strip units");
assertEqual(sanitizeDecimalDraft("12.5.5"), "12.55", "one separator");
assertEqual(sanitizeDecimalDraft("12,5"), "12,5", "keep comma");
assertEqual(sanitizeDecimalDraft("."), ".", "lone separator ok while typing");
assertEqual(sanitizeIntegerDraft("50★"), "50", "stars digits");
assertEqual(sanitizeIntegerDraft("1 000"), "1000", "spaces out");
assertEqual(decimalDraftLooksValid("80"), true, "plain kg");
assertEqual(decimalDraftLooksValid("80.5"), true, "decimal kg");
assertEqual(decimalDraftLooksValid("80a"), false, "junk");
assertEqual(decimalDraftLooksValid(""), false, "empty");
assertEqual(integerDraftLooksValid("50"), true, "stars");
assertEqual(integerDraftLooksValid(""), false, "empty stars");

console.log("numeric draft ok");
