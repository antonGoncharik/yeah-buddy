import { encodeShareQr } from "@/lib/share/qr";

export function ShareQr({ url, caption }: { url: string; caption: string }) {
  const qr = encodeShareQr(url);
  if (!qr) {
    return null;
  }

  return (
    <figure className="card-surface animate-rise flex flex-col items-center gap-3 px-5 py-5">
      <svg
        className="size-56 rounded-xl bg-white"
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={caption}
      >
        <rect width={qr.size} height={qr.size} fill="#fff" />
        <path fill="#111" d={qr.path} />
      </svg>
      <figcaption className="text-center text-base leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
