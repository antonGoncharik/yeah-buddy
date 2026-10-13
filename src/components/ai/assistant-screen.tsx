"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSISTANT_HISTORY_TURNS,
  ASSISTANT_MESSAGE_MAX,
} from "@/lib/ai/assistant/limits";
import { ApiError, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";

const ASSISTANT_EXAMPLES = [
  "Как прошло за последние месяцы — еда, вес и штанга?",
  "Почему вес стоит, а рабочие растут?",
  "Что добрать сегодня и из каких моих продуктов?",
] as const;

type Turn = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function turnId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AssistantScreen() {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (busy || trimmed.length < 2) {
      return;
    }
    setBusy(true);
    setError(null);
    const history = turns.slice(-ASSISTANT_HISTORY_TURNS);
    try {
      const data = await postJson("/api/ai/assistant", {
        message: trimmed,
        history: history.map((turn) => ({
          role: turn.role,
          text: turn.text,
        })),
      });
      if (
        data &&
        typeof data === "object" &&
        "answer" in data &&
        typeof (data as { answer: unknown }).answer === "string"
      ) {
        const answer = (data as { answer: string }).answer;
        setTurns((current) => [
          ...current,
          { id: turnId(), role: "user", text: trimmed },
          { id: turnId(), role: "assistant", text: answer },
        ]);
        setMessage("");
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
          Спроси про еду, зал, вес, программу или что угодно по дневнику за 90
          дней. Ответ по твоим цифрам, целиком.
        </p>
        {turns.length === 0 ? (
          <div className="flex flex-col gap-2">
            {ASSISTANT_EXAMPLES.map((example) => (
              <Button
                key={example}
                type="button"
                variant="secondary"
                className="h-auto min-h-11 w-full justify-start whitespace-normal px-3 py-2 text-left text-base"
                onClick={() => setMessage(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((turn) => (
              <section
                key={turn.id}
                className={
                  turn.role === "user"
                    ? "rounded-2xl bg-primary/10 px-4 py-3"
                    : "rounded-2xl border border-border/80 bg-muted/30 px-4 py-4"
                }
              >
                <p className="whitespace-pre-wrap text-base leading-snug">
                  {turn.text}
                </p>
              </section>
            ))}
          </div>
        )}
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Например: как связаны вес, белок и присед за эти месяцы?"
          rows={4}
          maxLength={ASSISTANT_MESSAGE_MAX}
          className="text-base"
        />
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={busy || message.trim().length < 2}
          onClick={() => void ask(message)}
        >
          {busy ? "Думаю…" : "Спросить"}
        </Button>
        {remaining != null ? (
          <p className="text-xs text-muted-foreground">
            Осталось вопросов сегодня: {remaining}
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
