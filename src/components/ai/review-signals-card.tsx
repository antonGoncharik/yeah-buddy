"use client";

export function ReviewSignalsCard({ signals }: { signals: string[] }) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
      <h2 className="text-sm font-medium text-muted-foreground">Цифры</h2>
      <ul className="flex flex-col gap-2.5">
        {signals.map((signal) => (
          <li key={signal} className="text-base leading-snug">
            {signal}
          </li>
        ))}
      </ul>
    </section>
  );
}
