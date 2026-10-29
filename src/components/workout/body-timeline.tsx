"use client";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { BodyTimelineCompareView } from "@/components/workout/body-timeline-compare-view";
import { BodyTimelineDatePick } from "@/components/workout/body-timeline-date-pick";
import { useBodyTimeline } from "@/components/workout/use-body-timeline";
import { formatIsoDate } from "@/lib/day/format";

export function BodyTimeline() {
  const confirm = useConfirm();
  const timeline = useBodyTimeline();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Тело</h3>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
          <span className="tabular-nums">
            {formatIsoDate(timeline.shotDate, "d MMM")}
          </span>
          <input
            type="date"
            lang="ru"
            value={timeline.shotDate}
            aria-label="Дата снимка"
            className="sr-only"
            onChange={(event) => timeline.setShotDate(event.target.value)}
          />
          Снимок
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void timeline.addPhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-sm leading-snug text-muted-foreground">
        Фото остаётся на этом телефоне. Под ним — вес, талия, калории и рабочие
        веса вокруг этих дат.
      </p>
      {timeline.photos.length > 1 ? (
        <div className="flex flex-col gap-2">
          <BodyTimelineDatePick
            label="Тогда"
            photos={timeline.photos}
            selected={timeline.thenDate}
            onPick={timeline.setThenDate}
          />
          <BodyTimelineDatePick
            label="Сейчас"
            photos={timeline.photos}
            selected={timeline.nowDate}
            onPick={timeline.setNowDate}
          />
        </div>
      ) : null}
      {timeline.canCompare && timeline.thenPhoto && timeline.nowPhoto ? (
        <BodyTimelineCompareView
          thenPhoto={timeline.thenPhoto}
          nowPhoto={timeline.nowPhoto}
          wipe={timeline.wipe}
          onWipe={timeline.setWipe}
          caption={timeline.caption}
          sharing={timeline.sharing}
          onSharing={timeline.setSharing}
          onShareError={(message) => timeline.setError(message)}
        />
      ) : timeline.nowPhoto ? (
        <div>
          {/* biome-ignore lint/performance/noImgElement: local body photo, not a remote asset */}
          <img
            src={timeline.nowPhoto.url}
            alt={formatIsoDate(timeline.nowPhoto.date, "d MMM")}
            className="aspect-[3/4] w-full rounded-2xl object-cover"
          />
        </div>
      ) : (
        <p className="text-base text-muted-foreground">
          Два снимка в разные дни — и можно провести границу между тогда и
          сейчас.
        </p>
      )}
      {timeline.error ? (
        <p className="text-base text-destructive">{timeline.error}</p>
      ) : null}
      {timeline.nowPhoto ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 self-start"
          onClick={() => {
            const photo = timeline.nowPhoto;
            if (!photo) {
              return;
            }
            void (async () => {
              const ok = await confirm({
                message: "Удалить этот снимок с телефона?",
                confirmLabel: "Удалить",
                cancelLabel: "Оставить",
              });
              if (!ok) {
                return;
              }
              await timeline.removeNowPhoto(photo);
            })();
          }}
        >
          Удалить этот снимок
        </Button>
      ) : null}
    </section>
  );
}
