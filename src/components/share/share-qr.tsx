import { encodeShareQr } from "@/lib/share/qr";
import { cn } from "@/lib/utils";

const LOGO_HREF = "/icons/qr-logo.png";
const LOGO_PAD = 0.12;

export function ShareQr({
  url,
  caption,
  compact = false,
}: {
  url: string;
  caption: string;
  compact?: boolean;
}) {
  const qr = encodeShareQr(url);
  if (!qr) {
    return null;
  }

  const pad = qr.logo.size * LOGO_PAD;
  const logo = qr.logo.size - pad * 2;

  return (
    <figure
      className={cn(
        "card-surface animate-rise flex flex-col items-center [--qr-frame:#cd4918] [--qr-ink:#2a100a] [--qr-paper:#fffaf6] dark:[--qr-frame:#e56b32] dark:[--qr-ink:#1a0c08] dark:[--qr-paper:#fff6ee]",
        compact ? "gap-3 px-4 py-4" : "gap-4 px-5 py-6",
      )}
    >
      <div
        className={cn(
          "w-full rounded-2xl p-[3px] dark:shadow-[0_10px_32px_color-mix(in_srgb,var(--qr-frame)_42%,transparent)]",
          compact ? "max-w-44" : "max-w-60",
        )}
        style={{ backgroundColor: "var(--qr-frame)" }}
      >
        <div
          className="rounded-[0.9rem] p-3"
          style={{ backgroundColor: "var(--qr-paper)" }}
        >
          <svg
            className="aspect-square w-full"
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            role="img"
            aria-label={caption}
          >
            <rect width={qr.size} height={qr.size} fill="var(--qr-paper)" />
            <path
              fill="var(--qr-ink)"
              d={qr.path}
              shapeRendering="crispEdges"
            />
            <rect
              x={qr.logo.x}
              y={qr.logo.y}
              width={qr.logo.size}
              height={qr.logo.size}
              rx={qr.logo.size * 0.18}
              fill="var(--qr-paper)"
            />
            <image
              href={LOGO_HREF}
              x={qr.logo.x + pad}
              y={qr.logo.y + pad}
              width={logo}
              height={logo}
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>
        </div>
      </div>
      <figcaption
        className={cn(
          "text-center leading-relaxed text-muted-foreground",
          compact ? "text-sm" : "text-base",
        )}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
