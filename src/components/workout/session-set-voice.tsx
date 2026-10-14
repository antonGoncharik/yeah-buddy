"use client";

import { Mic } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/telegram/haptic";
import { formatWeight } from "@/lib/workout/numbers";
import {
  type ParsedSetUtterance,
  parseSetUtterance,
} from "@/lib/workout/set-utterance";

export function SessionSetVoice({
  disabled,
  timed,
  needsWeight = true,
  onApply,
  onCommit,
}: {
  disabled: boolean;
  timed: boolean;
  needsWeight?: boolean;
  onApply: (patch: UtterancePatch) => void;
  onCommit?: (patch: UtterancePatch) => void;
}) {
  const [text, setText] = useState("");
  const [hearing, setHearing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  function apply(raw: string) {
    const parsed = parseSetUtterance(raw);
    if (!parsed) {
      haptic("warn");
      setHint("Не разобрал. Например: 82,5 на 6, запас 1.");
      return;
    }
    const patch = draftPatch(parsed, timed);
    onApply(patch);
    if (onCommit && utteranceReady(patch, timed, needsWeight)) {
      onCommit(patch);
    }
    haptic("commit");
    setHint(null);
    setText("");
  }

  function listen() {
    const Recognition = speechRecognition();
    if (!Recognition) {
      haptic("warn");
      setHint("Микрофон тут недоступен — напиши подход строкой.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setText(transcript);
      setHearing(false);
      apply(transcript);
    };
    recognition.onerror = () => {
      setHearing(false);
      setHint("Не услышал. Напиши строкой.");
    };
    recognition.onend = () => setHearing(false);
    setHearing(true);
    setHint(null);
    try {
      recognition.start();
    } catch {
      setHearing(false);
      setHint("Микрофон занят. Напиши подход строкой.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="size-11 shrink-0"
          disabled={disabled || hearing}
          aria-label="Сказать подход"
          onClick={listen}
        >
          <Mic className="size-4" aria-hidden />
        </Button>
        <Input
          value={text}
          disabled={disabled}
          placeholder={timed ? "30 секунд" : "82,5 на 6, запас 1"}
          className="h-11 text-base"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply(text);
            }
          }}
        />
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type UtterancePatch = {
  weight?: string;
  reps?: string;
  seconds?: string;
  rir?: string;
};

function utteranceReady(
  patch: UtterancePatch,
  timed: boolean,
  needsWeight: boolean,
): boolean {
  if (needsWeight) {
    const weight = Number(patch.weight?.replace(",", "."));
    if (!(weight > 0)) {
      return false;
    }
  }
  if (timed) {
    return Number(patch.seconds?.replace(",", ".")) > 0;
  }
  return Number(patch.reps) > 0;
}

function draftPatch(
  parsed: ParsedSetUtterance,
  timed: boolean,
): UtterancePatch {
  return {
    ...(parsed.weight != null ? { weight: formatWeight(parsed.weight) } : {}),
    ...(parsed.reps != null && !timed ? { reps: String(parsed.reps) } : {}),
    ...(parsed.seconds != null && timed
      ? { seconds: String(parsed.seconds) }
      : {}),
    ...(parsed.rir != null ? { rir: String(parsed.rir) } : {}),
  };
}

type SpeechResult = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

function speechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") {
    return null;
  }
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}
