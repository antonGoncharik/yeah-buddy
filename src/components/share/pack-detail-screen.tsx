"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED, PACK_NOT_FOUND, readApiError } from "@/lib/messages";
import {
  DAY_TEMPLATE_TITLES,
  formatKcal,
  formatMacro,
  getMealLabel,
} from "@/lib/nutrition";
import { packShareText, shareOrCopyLink } from "@/lib/share/client";
import { readSharePackPayload } from "@/lib/share/map";
import type { SharePackDetail } from "@/lib/share/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function PackDetailScreen({ token }: { token: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pack, setPack] = useState<SharePackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/packs/${token}`, {
        cache: "no-store",
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.status === 404) {
        setPack(null);
        setError(PACK_NOT_FOUND);
        return;
      }
      if (!response.ok) {
        throw new Error(readApiError(data) ?? LOAD_FAILED);
      }
      const loaded = readSharePackPayload(data);
      if (!loaded) {
        throw new Error(LOAD_FAILED);
      }
      setPack(loaded);
    } catch {
      setPack(null);
      setError(LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!pack) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/packs/${pack.token}/save`, {
        method: "POST",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }
      const loaded = readSharePackPayload(data);
      if (loaded) {
        setPack(loaded);
      }
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function onApply() {
    if (!pack) {
      return;
    }
    const ok = await confirm({
      message:
        pack.kind === "meals"
          ? "Еда на день станет как в ссылке. Уже записанные дни не изменятся. Цели БЖУ тоже."
          : "По кругу станет этой программой. Свои тренировки не удалятся — отложатся. Схема подходов тоже. Веса твои.",
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/packs/${pack.token}/apply`, {
        method: "POST",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }
      router.replace(
        pack.kind === "meals" ? "/settings/meals" : "/workouts/schedule",
      );
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!pack) {
      return;
    }
    const url = pack.share_url ?? window.location.href;
    try {
      const result = await shareOrCopyLink(url, packShareText(pack.kind));
      setCopied(result === "copied");
    } catch {
      setError(LOAD_FAILED);
    }
  }

  async function onRevoke() {
    if (!pack) {
      return;
    }
    const ok = await confirm({
      message: "Убрать ссылку? У тебя пакет останется, у друзей — нет.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/packs/${pack.token}/revoke`, {
        method: "POST",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }
      const loaded = readSharePackPayload(data);
      if (loaded) {
        setPack(loaded);
      }
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={pack?.title ?? "Ссылка"} backHref="/settings/packs" />

      <div className="flex flex-col gap-4 px-4 pb-40">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !pack ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && pack ? (
          <>
            <p className="animate-rise text-base text-muted-foreground">
              {packSubtitle(pack)}
            </p>

            {pack.kind === "meals" && pack.meals ? (
              <MealsPreview pack={pack} />
            ) : null}

            {pack.kind === "workouts" && pack.workouts ? (
              <WorkoutsPreview pack={pack} />
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {copied ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Ссылка скопирована.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {!loading && pack ? (
        <StickyActions>
          <Button
            className="h-14 text-lg"
            disabled={busy}
            onClick={() => void onApply()}
          >
            {busy ? "Сохранение…" : "Поставить себе"}
          </Button>
          {!pack.mine && !pack.saved ? (
            <Button
              variant="secondary"
              className="h-14 text-lg"
              disabled={busy}
              onClick={() => void onSave()}
            >
              Сохранить на потом
            </Button>
          ) : null}
          {pack.mine && !pack.revoked ? (
            <Button
              variant="secondary"
              className="h-14 text-lg"
              disabled={busy}
              onClick={() => void onShare()}
            >
              Поделиться
            </Button>
          ) : null}
          {pack.mine && !pack.revoked ? (
            <Button
              variant="ghost"
              className="h-12 text-base"
              disabled={busy}
              onClick={() => void onRevoke()}
            >
              Убрать ссылку
            </Button>
          ) : null}
        </StickyActions>
      ) : null}
    </div>
  );
}

function packSubtitle(pack: SharePackDetail): string {
  if (pack.revoked) {
    return "Ссылка выключена. Поставить себе ещё можно.";
  }
  if (pack.mine) {
    return pack.kind === "meals"
      ? "Снимок еды на день и целей БЖУ. Дневник не отдаём."
      : "Снимок круга и схемы. Веса не отдаём.";
  }
  if (pack.owner_name) {
    return `От ${pack.owner_name}`;
  }
  return pack.kind === "meals"
    ? "Еда на день. Можно сохранить и поставить себе."
    : "Тренировки по кругу. Можно сохранить и поставить себе.";
}

function MealsPreview({ pack }: { pack: SharePackDetail }) {
  const meals = pack.meals;
  if (!meals) {
    return null;
  }

  return (
    <>
      <section className="card-surface animate-rise flex flex-col gap-2 px-5 py-4">
        <h2 className="text-lg font-semibold">Цели</h2>
        <p className="text-sm text-muted-foreground">
          Отдых {formatMacro(meals.goals.rest_protein)} /{" "}
          {formatMacro(meals.goals.rest_fat)} /{" "}
          {formatMacro(meals.goals.rest_carbs)}
        </p>
        <p className="text-sm text-muted-foreground">
          Зал {formatMacro(meals.goals.training_protein)} /{" "}
          {formatMacro(meals.goals.training_fat)} /{" "}
          {formatMacro(meals.goals.training_carbs)}
        </p>
      </section>

      {meals.days.map((day) => (
        <section
          key={day.day_type}
          className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {DAY_TEMPLATE_TITLES[day.day_type]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatKcal(day.kcal)} ккал · {formatMacro(day.protein)} /{" "}
              {formatMacro(day.fat)} / {formatMacro(day.carbs)}
            </p>
          </div>
          {day.meals.map((meal) => (
            <div key={meal.meal_type} className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {getMealLabel(meal.meal_type)}
              </p>
              {meal.items.map((item) => (
                <p
                  key={`${meal.meal_type}-${item.name}-${item.grams}`}
                  className="text-sm text-muted-foreground"
                >
                  {item.name} · {item.grams} г
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function WorkoutsPreview({ pack }: { pack: SharePackDetail }) {
  const workouts = pack.workouts;
  if (!workouts) {
    return null;
  }

  return (
    <>
      <p className="px-1 text-sm text-muted-foreground">
        Подходы {workouts.formula_hint}
      </p>
      {workouts.days.map((day) => (
        <section
          key={day.name}
          className="card-surface animate-rise flex flex-col gap-2 px-5 py-4"
        >
          <h2 className="text-lg font-semibold">{day.name}</h2>
          <p className="text-sm text-muted-foreground">
            {WORKOUT_KIND_LABELS[day.kind]}
          </p>
          <p className="text-sm leading-relaxed">{day.exercises.join(" · ")}</p>
        </section>
      ))}
    </>
  );
}
