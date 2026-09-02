import { AppHeader } from "@/components/layout/app-header";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Настройки" />
      <p className="px-4 py-10 text-center text-muted-foreground">
        Цели для дня отдыха и тренировки.
      </p>
    </div>
  );
}
