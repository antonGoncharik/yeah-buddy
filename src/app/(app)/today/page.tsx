import { AppHeader } from "@/components/layout/app-header";

export default function TodayPage() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Сегодня" />
      <p className="px-4 py-10 text-center text-muted-foreground">
        Сегодня нет записей.
        <br />
        Создайте день отдыха или тренировочный день.
      </p>
    </div>
  );
}
