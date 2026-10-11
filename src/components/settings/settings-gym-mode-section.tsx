"use client";

import { Segmented } from "@/components/ui/segmented";

export function SettingsGymModeSection({
  gymEnabled,
  onChange,
}: {
  gymEnabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Тренировки</h2>
      <p className="text-sm text-muted-foreground">
        Вкладка «Тренировки», переключатель дня и разборы. Программы и история
        останутся, если включишь снова.
      </p>
      <Segmented
        value={gymEnabled ? "on" : "off"}
        options={[
          { id: "off", label: "Только еда" },
          { id: "on", label: "Еда и зал" },
        ]}
        onChange={(id) => onChange(id === "on")}
      />
    </section>
  );
}
