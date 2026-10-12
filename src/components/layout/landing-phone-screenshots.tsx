import Image from "next/image";

const SHOTS = [
  {
    src: "/screenshots/today.webp",
    alt: "Экран «Сегодня» с приёмами пищи и итогом дня",
    label: "Дневник",
  },
  {
    src: "/screenshots/workouts.webp",
    alt: "Тренировка с подходами и рабочими весами",
    label: "Зал",
  },
  {
    src: "/screenshots/muscles.webp",
    alt: "Карта мышц: объём за неделю по зонам тела",
    label: "Мышцы",
  },
] as const;

export function LandingPhoneScreenshots() {
  const [primary, ...rest] = SHOTS;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl"
      />
      <div className="card-surface overflow-hidden rounded-[2rem] p-3">
        <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-background">
          <Image
            src={primary.src}
            alt={primary.alt}
            width={390}
            height={844}
            sizes="(max-width: 768px) 100vw, 390px"
            priority
            className="h-auto w-full"
          />
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {rest.map((shot) => (
            <li key={shot.src} className="text-center">
              <div className="overflow-hidden rounded-xl border border-border/70">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={120}
                  height={260}
                  sizes="120px"
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                {shot.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
