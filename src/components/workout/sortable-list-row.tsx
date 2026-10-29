"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SortableRow({
  id,
  disabled,
  showHandle,
  index,
  variant,
  after,
  children,
}: {
  id: string;
  disabled: boolean;
  showHandle: boolean;
  index: number;
  variant: "rows" | "cards";
  after?: ReactNode;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null,
        ),
        transition,
      }}
      className={cn(
        "flex flex-col",
        variant === "rows" && "border-b border-border/70 last:border-b-0",
        isDragging && "z-10 opacity-40",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-1",
          variant === "rows" && "px-1 py-1",
        )}
      >
        {showHandle ? (
          disabled ? (
            <HandleSlot index={index} variant={variant} />
          ) : (
            <button
              type="button"
              className={cn(
                "flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl active:cursor-grabbing",
                variant === "cards" && "mt-1",
              )}
              aria-label={`Перетащить, ${index + 1}`}
              {...attributes}
              {...listeners}
            >
              <HandleFace index={index} />
            </button>
          )
        ) : null}
        <div
          className={cn(
            "min-w-0 flex-1",
            variant === "rows" && "flex items-center",
          )}
        >
          {children}
        </div>
      </div>
      {after}
    </div>
  );
}

export function SortableOverlayCard({
  index,
  variant,
  children,
}: {
  index: number;
  variant: "rows" | "cards";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-1 rounded-xl bg-card shadow-lg ring-1 ring-border/80",
        variant === "rows" && "px-1 py-1",
      )}
    >
      <HandleSlot index={index} variant={variant} />
      <div
        className={cn(
          "min-w-0 flex-1",
          variant === "rows" && "flex items-center",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function HandleSlot({
  index,
  variant,
}: {
  index: number;
  variant: "rows" | "cards";
}) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center",
        variant === "cards" && "mt-1",
      )}
    >
      <HandleFace index={index} />
    </span>
  );
}

function HandleFace({ index }: { index: number }) {
  return (
    <span className="flex h-8 items-center gap-0.5 rounded-full bg-muted pl-1 pr-2">
      <GripVertical className="size-3.5 text-muted-foreground" aria-hidden />
      <span className="text-sm font-semibold tabular-nums">{index + 1}</span>
    </span>
  );
}
