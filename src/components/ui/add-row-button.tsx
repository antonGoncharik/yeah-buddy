import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AddRowButton({
  label = "Добавить",
  disabled,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="size-11"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <Plus className="size-5" />
    </Button>
  );
}
