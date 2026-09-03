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
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );
  const count = options.length;

  return (
    <div
      className="relative grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-muted/80 p-1"
      style={{
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl bg-card shadow-sm transition-transform duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem - ${(count - 1) * 0.25}rem) / ${count})`,
          transform: `translateX(calc(${selectedIndex} * (100% + 0.25rem)))`,
        }}
      />
      {options.map((option) => {
        const selected = option.id === value;

        return (
          <Button
            key={option.id}
            type="button"
            variant="ghost"
            disabled={disabled}
            className={cn(
              "relative z-10 h-11 rounded-xl text-base shadow-none hover:bg-transparent",
              selected
                ? "bg-transparent text-foreground"
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
