import { encode } from "uqr";

const QR_BORDER = 4;
const FINDER_SIZE = 7;
const MODULE_RADIUS = 0.42;

export interface ShareQrFinder {
  x: number;
  y: number;
}

export interface ShareQrLogo {
  x: number;
  y: number;
  size: number;
}

export interface ShareQrModel {
  size: number;
  modules: string;
  finders: ShareQrFinder[];
  logo: ShareQrLogo;
}

export function encodeShareQr(url: string): ShareQrModel | null {
  const value = url.trim();
  if (value === "") {
    return null;
  }

  const { data, size } = encode(value, { ecc: "H", border: QR_BORDER });
  const finders = finderOrigins(size);
  const logo = logoHole(size);
  let modules = "";

  for (let y = 0; y < size; y += 1) {
    const row = data[y];
    const nextRow = data[y + 1];
    if (!row) {
      continue;
    }
    for (let x = 0; x < size; x += 1) {
      if (!row[x] || skipModule(x, y, finders, logo)) {
        continue;
      }
      modules += moduleDot(x, y);
      if (row[x + 1] && !skipModule(x + 1, y, finders, logo)) {
        modules += moduleLink(x, y, "h");
      }
      if (nextRow?.[x] && !skipModule(x, y + 1, finders, logo)) {
        modules += moduleLink(x, y, "v");
      }
    }
  }

  if (modules === "") {
    return null;
  }

  return { size, modules, finders, logo };
}

function finderOrigins(size: number): ShareQrFinder[] {
  return [
    { x: QR_BORDER, y: QR_BORDER },
    { x: size - QR_BORDER - FINDER_SIZE, y: QR_BORDER },
    { x: QR_BORDER, y: size - QR_BORDER - FINDER_SIZE },
  ];
}

function logoHole(size: number): ShareQrLogo {
  const reserved = QR_BORDER + FINDER_SIZE + 1;
  const maxSize = size - reserved * 2;
  let hole = Math.round(size * 0.28);
  if (hole % 2 === 0) {
    hole += 1;
  }
  hole = Math.min(Math.max(hole, 5), maxSize);
  if (hole % 2 === 0) {
    hole -= 1;
  }
  const origin = Math.floor((size - hole) / 2);
  return { x: origin, y: origin, size: hole };
}

function skipModule(
  x: number,
  y: number,
  finders: ShareQrFinder[],
  logo: ShareQrLogo,
): boolean {
  if (inRect(x, y, logo.x, logo.y, logo.size, logo.size)) {
    return true;
  }
  return finders.some((finder) =>
    inRect(x, y, finder.x, finder.y, FINDER_SIZE, FINDER_SIZE),
  );
}

function inRect(
  x: number,
  y: number,
  left: number,
  top: number,
  width: number,
  height: number,
): boolean {
  return x >= left && x < left + width && y >= top && y < top + height;
}

function moduleDot(x: number, y: number): string {
  const r = MODULE_RADIUS;
  const cx = x + 0.5;
  const cy = y + 0.5;
  return `M${fmt(cx - r)} ${fmt(cy)}a${r} ${r} 0 1 0 ${fmt(r * 2)} 0a${r} ${r} 0 1 0 ${fmt(-r * 2)} 0`;
}

function moduleLink(x: number, y: number, axis: "h" | "v"): string {
  const span = MODULE_RADIUS * 2;
  if (axis === "h") {
    return `M${fmt(x + 0.5)} ${fmt(y + 0.5 - MODULE_RADIUS)}h1v${fmt(span)}h-1z`;
  }
  return `M${fmt(x + 0.5 - MODULE_RADIUS)} ${fmt(y + 0.5)}h${fmt(span)}v1h${fmt(-span)}z`;
}

function fmt(value: number): string {
  return String(Math.round(value * 100) / 100);
}
