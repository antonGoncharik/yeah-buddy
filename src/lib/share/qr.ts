import { encode } from "uqr";

export function encodeShareQr(
  url: string,
): { size: number; path: string } | null {
  const value = url.trim();
  if (value === "") {
    return null;
  }

  const { data, size } = encode(value, { ecc: "H", border: 4 });
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

  return { size, path };
}
