"use client";

import { useRef, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { SessionScreenBody } from "@/components/workout/session-screen-body";
import { SessionScreenStickyFooter } from "@/components/workout/session-screen-sticky-footer";
import { SessionTemplateSwapSheet } from "@/components/workout/session-template-swap-sheet";
import { useRestTimer } from "@/components/workout/use-rest-timer";
import { useSessionExercisePairs } from "@/components/workout/use-session-exercise-pairs";
import { useSessionScreen } from "@/components/workout/use-session-screen";
import { restLoadTargetKg } from "@/lib/workout/rest-load";
import { sessionScreenContentPadding } from "@/lib/workout/session-screen-view";
import { restExerciseFor } from "@/lib/workout/session-set-interaction";

export function SessionScreen() {
  const screen = useSessionScreen();
  const {
    loading,
    error,
    detail,
    load,
    session,
    title,
    subtitle,
    showStickyComplete,
    busy,
    complete,
  } = screen;

  const { pairs, setPairs } = useSessionExercisePairs(
    session?.id,
    detail?.exercises,
  );
  const [templateOffer, setTemplateOffer] = useState<{
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  } | null>(null);

  const closing = useRef(false);
  const rest = useRestTimer(session?.id ?? null, session?.status === "planned");
  const canRest = session?.status === "planned" && !busy;
  const focusExerciseId = detail
    ? (restExerciseFor(detail, screen.openSetIds) ?? rest.exerciseId)
    : rest.exerciseId;
  const loadTarget = restLoadTargetKg(detail?.exercises ?? [], focusExerciseId);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={title} subtitle={subtitle} backHref="/workouts" />

      <div
        className={sessionScreenContentPadding(showStickyComplete, rest.left)}
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !detail ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && session && detail ? (
          <SessionScreenBody
            screen={screen}
            session={session}
            detail={detail}
            pairs={pairs}
            setPairs={setPairs}
            onOfferTemplate={setTemplateOffer}
            startRest={(id) => rest.start(id)}
          />
        ) : null}
      </div>

      {showStickyComplete && detail ? (
        <SessionScreenStickyFooter
          detail={detail}
          busy={busy}
          openSetIds={screen.openSetIds}
          restLeft={rest.left}
          restFinishedAway={rest.finishedAway}
          loadTarget={loadTarget}
          restRound={rest.round}
          canRest={canRest}
          focusExerciseId={focusExerciseId}
          lastRestSeconds={
            focusExerciseId ? rest.lastSeconds(focusExerciseId) : 0
          }
          onComplete={async () => {
            if (busy || closing.current) {
              return;
            }
            closing.current = true;
            try {
              await complete();
            } finally {
              closing.current = false;
            }
          }}
          onRestAdd={rest.add}
          onRestSubtract={rest.subtract}
          onRestStop={rest.stop}
          onRestRestart={rest.restart}
          onRestStart={(id) => rest.start(id)}
        />
      ) : null}

      {templateOffer && session ? (
        <SessionTemplateSwapSheet
          session={session}
          offer={templateOffer}
          onClose={() => setTemplateOffer(null)}
        />
      ) : null}
    </div>
  );
}
