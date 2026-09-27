import { DICTATE_AUDIO_MAX_BYTES } from "@/lib/ai/speech-wav";
import { AI_DICTATE_HEAVY, CHECK_FIELDS } from "@/lib/messages";

export { DICTATE_AUDIO_MAX_BYTES };

const MIME_ALIASES: Record<string, string> = {
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
  "audio/mpeg": "audio/mp3",
  "audio/mp3": "audio/mp3",
  "audio/ogg": "audio/ogg",
  "audio/opus": "audio/ogg",
  "audio/webm": "audio/webm",
  "audio/mp4": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/aac": "audio/aac",
  "audio/flac": "audio/flac",
};

export function dictateAudioMime(value: string): string | null {
  const mime = value.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  return MIME_ALIASES[mime] ?? null;
}

export async function readDictateAudioPart(
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

  const file = form.get("audio");
  if (!(file instanceof Blob) || file.size < 32) {
    return { ok: false, error: CHECK_FIELDS };
  }

  if (file.size > DICTATE_AUDIO_MAX_BYTES) {
    return { ok: false, error: AI_DICTATE_HEAVY };
  }

  const mimeType = dictateAudioMime(file.type);
  if (!mimeType) {
    return { ok: false, error: CHECK_FIELDS };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return { ok: true, mimeType, data: bytes.toString("base64") };
}
