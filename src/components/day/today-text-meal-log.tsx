"use client";

import { useState } from "react";

import { mealActionButtonClass } from "@/components/day/meal-action-bar";
import { persistPlateRows } from "@/components/day/persist-plate-rows";
import { plateRowsReadyToSave } from "@/components/day/plate-draft-commit";
import { requestTextMealDraft } from "@/components/day/text-meal-draft";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { MealChatHint } from "@/components/meal-chat/meal-chat-hint";
import { Button } from "@/components/ui/button";
import { reportActionError } from "@/lib/action-error";
import { textMealRemainingLine } from "@/lib/ai/quota-copy";
import { normalizeMealLogText } from "@/lib/ai/text-meal-input";
import {
  AI_TEXT_MEAL_EMPTY,
  AI_TEXT_MEAL_FAILED,
  LOAD_FAILED,
} from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function TodayTextMealForm({
  date,
  mealId,
  busy,
  embedded = false,
  onDone,
}: {
  date: string;
  mealId: string;
  busy: boolean;
  embedded?: boolean;
  onDone?: () => void;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quotaLine = textMealRemainingLine(remaining);
  const disabled = busy || working || remaining === 0;

  async function submit() {
    if (disabled) {
      return;
    }
    const normalized = normalizeMealLogText(text);
    if (!normalized) {
      setError(AI_TEXT_MEAL_EMPTY);
      haptic("warn");
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const draft = await requestTextMealDraft(normalized);
      if (draft.remaining != null) {
        setRemaining(draft.remaining);
      }
      if (draft.items.length === 0) {
        setError(AI_TEXT_MEAL_EMPTY);
        haptic("warn");
        return;
      }
      if (!plateRowsReadyToSave(draft.items)) {
        setError(AI_TEXT_MEAL_FAILED);
        haptic("warn");
        return;
      }
      const saved = await persistPlateRows({
        date,
        mealId,
        rows: draft.items,
      });
      if (!saved.ok) {
        setError(saved.message);
        haptic("warn");
        return;
      }
      haptic("commit");
      setText("");
      onDone?.();
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        embedded
          ? compact
            ? "gap-1.5"
            : "gap-2"
          : cn(
              "card-surface px-4",
              compact ? "gap-1.5 py-2" : "gap-2 py-3",
            ),
      )}
    >
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
        placeholder="овсянка 80 г, яйца 2 шт"
        rows={compact ? 2 : 3}
        disabled={disabled}
        autoFocus
        className={cn(
          "w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-foreground",
          compact ? "text-sm" : "text-base",
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
      />
      {quotaLine ? (
        <p className="text-xs text-muted-foreground">{quotaLine}</p>
      ) : null}
      <MealChatHint className="text-xs" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="button"
        className={cn("w-full", mealActionButtonClass)}
        disabled={disabled || text.trim() === ""}
        onClick={() => void submit()}
      >
        {working ? "Разбираю…" : "Записать"}
      </Button>
    </div>
  );
}
