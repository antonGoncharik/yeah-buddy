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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

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
                <OverlayCard index={activeIndex} variant={variant}>
                  {renderItem(activeItem, activeIndex)}
                </OverlayCard>
              ) : null}
            </DragOverlay>,
            overlayHost,
          )
        : null}
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
        isDragging && "z-10 opacity-40",
      )}
    >
      {showHandle && !disabled ? (
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
      ) : (
        <HandleSlot index={index} variant={variant} />
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

function OverlayCard({
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
