"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-muted/80 p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const selected = option.id === value;

        return (
          <Button
            key={option.id}
            type="button"
            variant="ghost"
            disabled={disabled}
            className={cn(
              "h-11 rounded-xl text-base shadow-none",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
