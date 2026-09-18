import { encode } from "uqr";

const QR_BORDER = 4;
const FINDER_SIZE = 7;
const LOGO_RATIO = 0.2;

export interface ShareQrLogo {
  x: number;
  y: number;
  size: number;
}

export interface ShareQrModel {
  size: number;
  path: string;
  logo: ShareQrLogo;
}

export function encodeShareQr(url: string): ShareQrModel | null {
  const value = url.trim();
  if (value === "") {
    return null;
  }

  const { data, size } = encode(value, { ecc: "H", border: QR_BORDER });
  const logo = logoSlot(size);
  let path = "";

  for (let y = 0; y < size; y += 1) {
    const row = data[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < size; x += 1) {
      if (row[x]) {
        path += `M${x} ${y}h1v1h-1z`;
      }
    }
  }

  if (path === "") {
    return null;
  }

  return { size, path, logo };
}

function logoSlot(size: number): ShareQrLogo {
  const reserved = QR_BORDER + FINDER_SIZE + 1;
  const maxSize = size - reserved * 2;
  let hole = Math.round(size * LOGO_RATIO);
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
