"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactNode, useRef } from "react";

import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled,
  renderItem,
  variant = "rows",
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  disabled?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  variant?: "rows" | "cards";
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const canSort = !disabled && items.length > 1;
  const lastOverId = useRef<string | number | null>(null);

  function onDragStart() {
    lastOverId.current = null;
    haptic("tap");
  }

  function onDragOver(event: DragOverEvent) {
    const overId = event.over?.id;
    if (overId == null || overId === event.active.id) {
      return;
    }
    if (overId === lastOverId.current) {
      return;
    }
    lastOverId.current = overId;
    haptic("tick");
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    haptic("commit");
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={variant === "cards" ? "flex flex-col gap-3" : undefined}
        >
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              disabled={!canSort}
              showHandle={items.length > 1}
              index={index}
              variant={variant}
            >
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  disabled,
  showHandle,
  index,
  variant,
  children,
}: {
  id: string;
  disabled: boolean;
  showHandle: boolean;
  index: number;
  variant: "rows" | "cards";
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
        "flex items-start gap-1",
        variant === "rows" &&
          "border-b border-border/70 px-1 py-1 last:border-b-0",
        isDragging && "relative z-10 rounded-xl bg-card shadow-lg",
      )}
    >
      {showHandle ? (
        <button
          type="button"
          className={cn(
            "flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl active:cursor-grabbing disabled:opacity-50",
            variant === "cards" && "mt-1",
          )}
          aria-label="Перетащить"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
            {index + 1}
          </span>
        </button>
      ) : (
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center",
            variant === "cards" && "mt-1",
          )}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
            {index + 1}
          </span>
        </span>
      )}
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
