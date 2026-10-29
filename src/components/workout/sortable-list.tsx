"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  type Modifier,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SortableOverlayCard,
  SortableRow,
} from "@/components/workout/sortable-list-row";

import { haptic } from "@/lib/telegram/haptic";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled,
  renderItem,
  renderAfter,
  variant = "rows",
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  disabled?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  /** Full-width under the handle row — expanded editors, not squeezed beside the number. */
  renderAfter?: (item: T, index: number) => ReactNode;
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);
  const lastOverId = useRef<string | number | null>(null);

  useEffect(() => {
    setOverlayHost(document.body);
  }, []);

  const activeIndex = activeId
    ? items.findIndex((item) => item.id === activeId)
    : -1;
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
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
    setActiveId(null);
    lastOverId.current = null;
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
      modifiers={[restrictToVerticalAxis]}
      autoScroll={{ layoutShiftCompensation: false }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        lastOverId.current = null;
      }}
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
              after={renderAfter?.(item, index)}
            >
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
      {overlayHost
        ? createPortal(
            <DragOverlay dropAnimation={dropAnimation}>
              {activeItem ? (
                <SortableOverlayCard index={activeIndex} variant={variant}>
                  {renderItem(activeItem, activeIndex)}
                </SortableOverlayCard>
              ) : null}
            </DragOverlay>,
            overlayHost,
          )
        : null}
    </DndContext>
  );
}
