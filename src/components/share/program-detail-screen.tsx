"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { ShareQr } from "@/components/share/share-qr";
import { useProgramDetailScreen } from "@/components/share/use-program-detail-screen";
import { Button } from "@/components/ui/button";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

export function ProgramDetailScreen({ id }: { id: string }) {
  const {
    program,
    loading,
    error,
    busy,
    copied,
    qrCaption,
    load,
    leave,
    onApply,
    onShare,
  } = useProgramDetailScreen(id);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={program?.name ?? "Программа"} backHref="/workouts" />

      <div
        className={cn(
          "flex flex-col gap-4 px-4",
          program && !program.applied
            ? "pb-[var(--app-field-scroll-pad)]"
            : "pb-8",
        )}
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !program ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && program ? (
          <>
            <p className="animate-rise text-base text-muted-foreground">
              {program.hint}
            </p>

            {program.share_url && isTelegramMeUrl(program.share_url) ? (
              <ShareQr url={program.share_url} caption={qrCaption} />
            ) : null}

            {program.days.map((day) => (
              <section
                key={day.name}
                className="card-surface animate-rise flex flex-col gap-2 px-5 py-4"
              >
                <h2 className="text-lg font-semibold">{day.name}</h2>
                <p className="text-sm leading-relaxed">{day.exercises}</p>
              </section>
            ))}

            {program.weeks ? (
              <p className="animate-rise px-1 text-sm text-muted-foreground">
                Недели: {program.weeks.join(" → ")}
              </p>
            ) : null}

            <div className="animate-rise flex flex-col gap-2">
              {program.share_url ? (
                <Button
                  variant={program.applied ? "default" : "secondary"}
                  className="h-14 text-lg"
                  disabled={busy}
                  onClick={() => void onShare()}
                >
                  Поделиться
                </Button>
              ) : null}
              {program.applied ? (
                <p className="px-1 text-sm text-muted-foreground">
                  Уже стоит. Максимум на раз спросит в зале, если его нет.
                </p>
              ) : null}
              {copied ? (
                <p className="animate-fade text-sm text-muted-foreground">
                  Ссылка скопирована.
                </p>
              ) : null}
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {!loading && program && !program.applied ? (
        <StickyActions>
          <Button
            variant="ghost"
            className="h-12 text-base"
            disabled={busy}
            onClick={leave}
          >
            Не сейчас
          </Button>
          <Button
            className="h-14 text-lg"
            disabled={busy}
            onClick={() => void onApply()}
          >
            {busy ? "Сохранение…" : "Поставить себе"}
          </Button>
        </StickyActions>
      ) : null}
    </div>
  );
}
