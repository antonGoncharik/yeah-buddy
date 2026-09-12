import type { KeyboardEvent } from "react";

const FIELD_SELECTOR =
  "input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([disabled]):not([readonly])";
const REVEAL_MS = 320;

let revealTimer = 0;

export function revealField(node: HTMLElement): void {
  if (typeof window === "undefined") {
    return;
  }

  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(() => {
    if (
      document.activeElement !== node &&
      !node.contains(document.activeElement)
    ) {
      return;
    }
    node.scrollIntoView({ block: "center", inline: "nearest" });
  }, REVEAL_MS);
}

export function handleNumericEnter(
  event: KeyboardEvent<HTMLInputElement>,
): void {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  const input = event.currentTarget;
  const root = input.form ?? input.closest("[data-field-group]");
  const fields = root
    ? Array.from(root.querySelectorAll<HTMLInputElement>(FIELD_SELECTOR))
    : [];
  const index = fields.indexOf(input);
  const next = index >= 0 ? fields[index + 1] : undefined;
  if (next) {
    next.focus();
    next.select();
    return;
  }

  if (input.form) {
    input.form.requestSubmit();
    return;
  }

  input.blur();
}
