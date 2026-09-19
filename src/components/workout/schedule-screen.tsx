"use client";

import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { SetsDoodle } from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { PublishPackButton } from "@/components/share/publish-pack-button";
import { buttonVariants } from "@/components/ui/button";
import { ScheduleActiveList } from "@/components/workout/schedule-active-list";
import { ScheduleInactiveList } from "@/components/workout/schedule-inactive-list";
import { ScheduleProgramsSection } from "@/components/workout/schedule-programs-section";
import { useScheduleScreen } from "@/components/workout/use-schedule-screen";
import { cn } from "@/lib/utils";
import { FORMULAS_LABEL, QUEUE_LABEL } from "@/lib/workout/labels";

export function ScheduleScreen() {
  const {
    active,
    inactive,
    loading,
    error,
    saving,
    showPrograms,
    setShowPrograms,
    load,
    persist,
    applyPreset,
    setInCircle,
  } = useScheduleScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={QUEUE_LABEL}
        subtitle="Дни идут друг за другом, не по календарю"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-5 px-4 pb-48">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && active.length === 0 && inactive.length === 0 ? (
          <>
            <p className="animate-fade px-1 text-base leading-relaxed text-muted-foreground">
              Программа пока пустая. Поставь готовую или собери тренировку сам.
            </p>
            <ScheduleProgramsSection
              saving={saving}
              onPick={(presetId) => void applyPreset(presetId)}
            />
          </>
        ) : null}

        {!loading ? (
          <ScheduleActiveList
            active={active}
            inactive={inactive}
            saving={saving}
            onPersist={persist}
            onSetInCircle={setInCircle}
          />
        ) : null}

        {!loading ? (
          <ScheduleInactiveList
            inactive={inactive}
            saving={saving}
            onSetInCircle={setInCircle}
          />
        ) : null}

        {!loading && (active.length > 0 || inactive.length > 0) ? (
          <section className="card-surface divide-y divide-border/70 px-5 py-2">
            <NavRow
              href="/settings/formulas"
              title={FORMULAS_LABEL}
              hint="3×5, если в дне нет своих"
              icon={<SetsDoodle />}
            />
          </section>
        ) : null}

        {!loading && (active.length > 0 || inactive.length > 0) ? (
          showPrograms ? (
            <ScheduleProgramsSection
              saving={saving}
              onPick={(presetId) => void applyPreset(presetId)}
            />
          ) : (
            <button
              type="button"
              className="card-surface flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
              onClick={() => setShowPrograms(true)}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium">
                  Готовые программы
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Поставить вместо своих дней
                </span>
              </span>
              <ChevronDown
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </button>
          )
        ) : null}

        {!loading ? (
          <StickyActions>
            {active.length > 0 ? (
              <PublishPackButton kind="workouts" from="schedule" />
            ) : null}
            <Link
              href="/workouts/templates/new"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "h-14 gap-2 text-lg",
              )}
            >
              <Plus className="size-5" aria-hidden />
              Новая тренировка
            </Link>
          </StickyActions>
        ) : null}
      </div>
    </div>
  );
}
