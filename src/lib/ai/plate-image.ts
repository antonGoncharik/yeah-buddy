import { CHECK_FIELDS } from "@/lib/messages";

export const PLATE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function readPlateImagePart(
  request: Request,
): Promise<
  { ok: true; mimeType: string; data: string } | { ok: false; error: string }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return { ok: false, error: CHECK_FIELDS };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, error: CHECK_FIELDS };
  }

  const file = form.get("image");
  if (!(file instanceof Blob) || file.size < 32) {
    return { ok: false, error: CHECK_FIELDS };
  }

  if (file.size > PLATE_IMAGE_MAX_BYTES) {
    return { ok: false, error: "Фото слишком тяжёлое." };
  }

  const mimeType = normalizeMime(file.type);
  if (!ALLOWED_TYPES.has(mimeType)) {
    return { ok: false, error: CHECK_FIELDS };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return { ok: true, mimeType, data: bytes.toString("base64") };
}

function normalizeMime(value: string): string {
  const mime = value.trim().toLowerCase();
  if (mime === "image/jpg") {
    return "image/jpeg";
  }
  return mime;
}
