"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
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
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled,
  renderItem,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  disabled?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const canSort = !disabled && items.length > 1;

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

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              disabled={!canSort}
              showHandle={items.length > 1}
              index={index}
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
  children,
}: {
  id: string;
  disabled: boolean;
  showHandle: boolean;
  index: number;
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
        "flex items-center gap-1 border-b border-border/70 px-1 py-1 last:border-b-0",
        isDragging && "relative z-10 rounded-xl bg-card shadow-lg",
      )}
    >
      {showHandle ? (
        <button
          type="button"
          className="flex size-11 shrink-0 touch-none items-center justify-center rounded-xl disabled:opacity-50"
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
        <span className="flex size-11 shrink-0 items-center justify-center">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
            {index + 1}
          </span>
        </span>
      )}
      {children}
    </div>
  );
}
