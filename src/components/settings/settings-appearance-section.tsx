"use client";

import { Moon, Sun } from "lucide-react";

import { Segmented } from "@/components/ui/segmented";
import type { DiaryDensity } from "@/lib/diary-density";
import { DARK_THEME_LABEL } from "@/lib/flavor";
import type { Theme } from "@/lib/theme";
import type { TodayOrder } from "@/lib/today-order";

export function SettingsAppearanceSection({
  theme,
  setTheme,
  density,
  setDensity,
  order,
  setOrder,
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  density: DiaryDensity;
  setDensity: (density: DiaryDensity) => void;
  order: TodayOrder;
  setOrder: (order: TodayOrder) => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Вид</h2>
      <Segmented
        value={theme}
        options={[
          {
            id: "light",
            label: "Светлая",
            icon: <Sun className="size-4" aria-hidden />,
          },
          {
            id: "dark",
            label: DARK_THEME_LABEL,
            icon: <Moon className="size-4" aria-hidden />,
          },
        ]}
        onChange={setTheme}
      />
      <Segmented
        value={density}
        options={[
          { id: "compact", label: "Компактный" },
          { id: "expanded", label: "Расширенный" },
        ]}
        onChange={setDensity}
      />
      <p className="text-sm leading-snug text-muted-foreground">
        Компактный ужимает день и тренировки. Расширенный показывает БЖУ у
        каждого продукта.
      </p>
      <Segmented
        value={order}
        options={[
          { id: "meals", label: "Сначала еда" },
          { id: "numbers", label: "Сначала цифры" },
        ]}
        onChange={setOrder}
      />
      <p className="text-sm leading-snug text-muted-foreground">
        Еда оставляет приёмы под итогом, разбор БЖУ внизу. Цифры поднимают
        белок, калории и полоски над приёмами.
      </p>
    </section>
  );
}
