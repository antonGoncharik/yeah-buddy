import { dictateAudioMime } from "@/lib/ai/dictate-audio";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(dictateAudioMime("audio/wav"), "audio/wav", "wav");
assertEqual(dictateAudioMime("audio/x-wav"), "audio/wav", "x-wav");
assertEqual(dictateAudioMime("AUDIO/WAV; charset=binary"), "audio/wav", "case");
assertEqual(
  dictateAudioMime("audio/ogg; codecs=opus"),
  "audio/ogg",
  "opus ogg",
);
assertEqual(dictateAudioMime("audio/webm"), "audio/webm", "webm");
assertEqual(dictateAudioMime("audio/mp4"), "audio/mp4", "mp4");
assertEqual(dictateAudioMime("audio/mpeg"), "audio/mp3", "mpeg");
assertEqual(dictateAudioMime("image/jpeg"), null, "photo is not speech");
assertEqual(dictateAudioMime(""), null, "empty mime");

console.log("dictate audio ok");
