import { FIELD_ERROR_CLASS, fieldErrorClassName } from "@/lib/form/field-error";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  FIELD_ERROR_CLASS.includes("text-base"),
  "field errors use base size",
);
assert(
  fieldErrorClassName("mt-2", true).includes("text-center"),
  "centered field errors",
);
