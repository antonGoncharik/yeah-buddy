import { Button } from "@/components/ui/button";

export function ScreenLoading() {
  return (
    <p className="animate-fade py-10 text-center text-lg text-muted-foreground">
      Загрузка…
    </p>
  );
}

export function ScreenError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="animate-rise flex flex-col items-center gap-3 py-10">
      <p className="text-center text-lg font-medium">{message}</p>
      <Button className="h-12 min-w-40 text-base" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
