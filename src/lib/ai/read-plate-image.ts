export const PLATE_CLIENT_MAX_SIDE = 1280;
export const PLATE_CLIENT_MAX_BYTES = 900_000;

export async function compressPlateImage(file: File): Promise<Blob> {
  if (file.size < 32) {
    throw new Error("empty");
  }

  const source = await loadImage(file);
  const scale = Math.min(
    1,
    PLATE_CLIENT_MAX_SIDE / Math.max(source.width, source.height),
  );
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    source.close();
    throw new Error("canvas");
  }

  context.drawImage(source.image, 0, 0, width, height);
  source.close();

  const high = await canvasToJpeg(canvas, 0.72);
  if (high.size <= PLATE_CLIENT_MAX_BYTES) {
    return high;
  }

  const low = await canvasToJpeg(canvas, 0.52);
  if (low.size <= PLATE_CLIENT_MAX_BYTES * 1.2) {
    return low;
  }

  throw new Error("too-heavy");
}

async function loadImage(file: File): Promise<{
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("decode"));
    element.src = url;
  });

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(url),
  };
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size < 32) {
          reject(new Error("encode"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}
