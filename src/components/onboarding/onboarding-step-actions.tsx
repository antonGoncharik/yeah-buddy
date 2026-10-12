"use client";

import { Button } from "@/components/ui/button";

export function OnboardingPrimaryAction({
  saving = false,
  isLast = false,
  disabled = false,
  label,
  savingLabel = "Секунду…",
  variant = "default",
  onClick,
}: {
  saving?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  label?: string;
  savingLabel?: string;
  variant?: "default" | "outline";
  onClick: () => void;
}) {
  const text = saving ? savingLabel : (label ?? (isLast ? "Готово" : "Дальше"));

  return (
    <Button
      type="button"
      variant={variant}
      className="h-14 w-full text-lg"
      disabled={disabled || saving}
      onClick={onClick}
    >
      {text}
    </Button>
  );
}
