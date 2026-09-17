import Image from "next/image";

import { encodeShareQr } from "@/lib/share/qr";

const LOGO_SRC = "/icons/qr-logo.png";
const LOGO_INSET = 0;
const TREX_INK = "#cd4918";

export function ShareQr({ url, caption }: { url: string; caption: string }) {
  const qr = encodeShareQr(url);
  if (!qr) {
    return null;
  }

  const badge = qr.logo.size * (1 - LOGO_INSET * 2);
  const badgeOffset = qr.logo.size * LOGO_INSET;
  const toPercent = (value: number) => `${(value / qr.size) * 100}%`;

  return (
    <figure className="card-surface animate-rise flex flex-col items-center gap-4 px-5 py-6">
      <div className="relative w-full max-w-60">
        <svg
          className="aspect-square w-full overflow-hidden rounded-2xl bg-white"
          style={{ color: TREX_INK }}
          viewBox={`0 0 ${qr.size} ${qr.size}`}
          role="img"
          aria-label={caption}
        >
          <path fill="currentColor" d={qr.modules} />
          {qr.finders.map((finder) => (
            <g
              key={`${finder.x}-${finder.y}`}
              transform={`translate(${finder.x} ${finder.y})`}
            >
              <rect width="7" height="7" rx="1.55" fill="currentColor" />
              <rect x="1" y="1" width="5" height="5" rx="1.05" fill="#fff" />
              <rect
                x="2"
                y="2"
                width="3"
                height="3"
                rx="0.7"
                fill="currentColor"
              />
            </g>
          ))}
        </svg>
        <div
          className="absolute"
          style={{
            top: toPercent(qr.logo.y + badgeOffset),
            left: toPercent(qr.logo.x + badgeOffset),
            width: toPercent(badge),
            height: toPercent(badge),
          }}
        >
          <Image
            src={LOGO_SRC}
            alt=""
            fill
            sizes="120px"
            draggable={false}
            className="object-contain"
          />
        </div>
      </div>
      <figcaption className="text-center text-base leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
