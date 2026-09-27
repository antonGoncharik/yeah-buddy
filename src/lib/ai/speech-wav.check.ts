import {
  encodeSpeechWav,
  formatSpeechClock,
  SPEECH_SAMPLE_RATE,
  speechPeak,
} from "@/lib/ai/speech-wav";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const samples = new Float32Array(SPEECH_SAMPLE_RATE);
samples[0] = 0.5;
samples[1] = -1.5;
const wav = encodeSpeechWav(samples, SPEECH_SAMPLE_RATE);
const view = new DataView(wav);
const ascii = (offset: number, length: number) =>
  String.fromCharCode(
    ...Array.from({ length }, (_, index) => view.getUint8(offset + index)),
  );

assertEqual(ascii(0, 4), "RIFF", "riff");
assertEqual(ascii(8, 4), "WAVE", "wave");
assertEqual(view.getUint16(20, true), 1, "pcm");
assertEqual(view.getUint16(22, true), 1, "mono");
assertEqual(view.getUint32(24, true), SPEECH_SAMPLE_RATE, "rate");
assertEqual(wav.byteLength, 44 + samples.length * 2, "length");
assertEqual(view.getInt16(44, true), Math.round(0.5 * 0x7fff), "half scale");
assertEqual(view.getInt16(46, true), -0x8000, "clamp low");
assertEqual(speechPeak(samples), 1.5, "peak before clamp");
assertEqual(formatSpeechClock(0), "0:00", "zero clock");
assertEqual(formatSpeechClock(65), "1:05", "clock");
assertEqual(formatSpeechClock(-3), "0:00", "negative clock");

console.log("speech wav ok");
