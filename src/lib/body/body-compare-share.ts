function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  context.drawImage(
    image,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  );
  context.restore();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const next = line === "" ? word : `${line} ${word}`;
    if (context.measureText(next).width > maxWidth && line !== "") {
      context.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
      continue;
    }
    line = next;
  }
  if (line !== "") {
    context.fillText(line, x, cursor);
  }
}

export async function shareBodyCompareCard(
  thenUrl: string,
  nowUrl: string,
  thenLabel: string,
  nowLabel: string,
  caption: string,
) {
  const [before, after] = await Promise.all([
    loadImage(thenUrl),
    loadImage(nowUrl),
  ]);
  const width = 1080;
  const photoWidth = width / 2;
  const photoHeight = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = photoHeight + 220;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas");
  }
  context.fillStyle = "#111111";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawCover(context, before, 0, 0, photoWidth, photoHeight);
  drawCover(context, after, photoWidth, 0, photoWidth, photoHeight);
  context.fillStyle = "rgba(0,0,0,0.45)";
  context.fillRect(0, photoHeight - 72, photoWidth, 72);
  context.fillRect(photoWidth, photoHeight - 72, photoWidth, 72);
  context.fillStyle = "#f5f5f5";
  context.font = "32px sans-serif";
  context.fillText(thenLabel, 28, photoHeight - 26);
  context.fillText(nowLabel, photoWidth + 28, photoHeight - 26);
  context.font = "36px sans-serif";
  wrapText(context, caption, 48, photoHeight + 64, width - 96, 46);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) {
    throw new Error("blob");
  }
  const file = new File([blob], "yeah-buddy-body.jpg", { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Тогда и сейчас" });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}
