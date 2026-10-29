"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewMacroScreenLoadError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <p className="text-center font-medium">{error}</p>
      <Button className="h-12 min-w-40 text-base" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

export function NewMacroScreenQueueEmpty() {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <p className="text-lg font-medium">Программа пустая</p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Недели меняют вес в тех тренировках, что стоят в программе. Сначала
        поставь готовую или собери день.
      </p>
      <Link
        href="/workouts/schedule"
        className={cn(buttonVariants(), "h-14 text-lg")}
      >
        К программе
      </Link>
    </section>
  );
}
