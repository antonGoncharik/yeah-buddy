"use client";

import { Moon, Sun } from "lucide-react";

import { Segmented } from "@/components/ui/segmented";
import { DARK_THEME_LABEL } from "@/lib/flavor";
import type { Theme } from "@/lib/theme";

export function SettingsAppearanceSection({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Тема</h2>
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
    </section>
  );
}
