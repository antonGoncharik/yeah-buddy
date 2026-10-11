"use client";

import { Button } from "@/components/ui/button";

export function OnboardingPrimaryAction({
  saving = false,
  isLast = false,
  disabled = false,
  label,
  variant = "default",
  onClick,
}: {
  saving?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: "default" | "outline";
  onClick: () => void;
}) {
  const text = saving ? "Секунду…" : (label ?? (isLast ? "Готово" : "Дальше"));

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
