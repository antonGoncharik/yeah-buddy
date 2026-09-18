import { encodeShareQr } from "@/lib/share/qr";

const LOGO_HREF = "/icons/qr-logo.png";
const LOGO_PAD = 0.12;
const TREX_INK = "#cd4918";
const QR_INK = "#2a100a";
const QR_PAPER = "#fffaf6";

export function ShareQr({ url, caption }: { url: string; caption: string }) {
  const qr = encodeShareQr(url);
  if (!qr) {
    return null;
  }

  const pad = qr.logo.size * LOGO_PAD;
  const logo = qr.logo.size - pad * 2;

  return (
    <figure className="card-surface animate-rise flex flex-col items-center gap-4 px-5 py-6">
      <div
        className="w-full max-w-60 rounded-2xl p-[3px]"
        style={{ backgroundColor: TREX_INK }}
      >
        <div
          className="rounded-[0.9rem] p-3"
          style={{ backgroundColor: QR_PAPER }}
        >
          <svg
            className="aspect-square w-full"
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            role="img"
            aria-label={caption}
          >
            <rect width={qr.size} height={qr.size} fill={QR_PAPER} />
            <path fill={QR_INK} d={qr.path} shapeRendering="crispEdges" />
            <rect
              x={qr.logo.x}
              y={qr.logo.y}
              width={qr.logo.size}
              height={qr.logo.size}
              rx={qr.logo.size * 0.18}
              fill={QR_PAPER}
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
      <figcaption className="text-center text-base leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
