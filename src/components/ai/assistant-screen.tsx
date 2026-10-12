"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";

export function AssistantScreen() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function ask() {
    if (busy || message.trim().length < 2) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await postJson("/api/ai/assistant", {
        message: message.trim(),
      });
      if (
        data &&
        typeof data === "object" &&
        "answer" in data &&
        typeof (data as { answer: unknown }).answer === "string"
      ) {
        setAnswer((data as { answer: string }).answer);
        const rem = (data as { remaining?: unknown }).remaining;
        setRemaining(typeof rem === "number" ? rem : null);
      } else {
        setError(LOAD_FAILED);
      }
    } catch (caught) {
      if (caught instanceof ApiError && typeof caught.message === "string") {
        setError(caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Спросить" backHref="/progress" />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <p className="text-sm text-muted-foreground">
          Вопросы про сегодняшние калории, следующую тренировку и продукты —
          ответ только по твоему дневнику.
        </p>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Например: сколько белка осталось и что добавить на ужин?"
          rows={4}
          className="text-base"
        />
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={busy || message.trim().length < 2}
          onClick={() => void ask()}
        >
          {busy ? "Думаю…" : "Спросить"}
        </Button>
        {remaining != null ? (
          <p className="text-xs text-muted-foreground">
            Осталось вопросов сегодня: {remaining}
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {answer ? (
          <section className="rounded-2xl border border-border/80 bg-muted/30 px-4 py-4">
            <p className="whitespace-pre-wrap text-base leading-snug">
              {answer}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
