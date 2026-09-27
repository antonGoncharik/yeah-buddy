export const SPEECH_SAMPLE_RATE = 16_000;
export const SPEECH_MAX_SECONDS = 45;
export const SPEECH_MIN_SECONDS = 0.4;
export const DICTATE_AUDIO_MAX_BYTES = 2 * 1024 * 1024;

export function encodeSpeechWav(
  samples: Float32Array,
  sampleRate: number,
): ArrayBuffer {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(offset, scaleSample(samples[index] ?? 0), true);
    offset += 2;
  }

  return buffer;
}

export function speechPeak(samples: Float32Array): number {
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.abs(samples[index] ?? 0);
    if (value > peak) {
      peak = value;
    }
  }
  return peak;
}

export function formatSpeechClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export async function speechBlobToWav(
  blob: Blob,
): Promise<
  { ok: true; wav: Blob } | { ok: false; reason: "silent" | "unreadable" }
> {
  const Ctor = audioContextCtor();
  if (!Ctor) {
    return { ok: false, reason: "unreadable" };
  }

  const context = new Ctor();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const length = Math.min(
      Math.ceil(decoded.duration * SPEECH_SAMPLE_RATE),
      SPEECH_SAMPLE_RATE * SPEECH_MAX_SECONDS,
    );
    if (length < SPEECH_SAMPLE_RATE * SPEECH_MIN_SECONDS) {
      return { ok: false, reason: "silent" };
    }

    const offline = new OfflineAudioContext(1, length, SPEECH_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);
    if (speechPeak(samples) < 0.01) {
      return { ok: false, reason: "silent" };
    }

    const wav = encodeSpeechWav(samples, SPEECH_SAMPLE_RATE);
    return { ok: true, wav: new Blob([wav], { type: "audio/wav" }) };
  } catch {
    return { ok: false, reason: "unreadable" };
  } finally {
    await context.close().catch(() => undefined);
  }
}

function scaleSample(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const sample = Math.max(-1, Math.min(1, value));
  const scaled =
    sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
  return Math.max(-0x8000, Math.min(0x7fff, scaled));
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const webkit = (
    window as Window & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;
  return window.AudioContext ?? webkit ?? null;
}
